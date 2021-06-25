import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireUploadTask } from '@angular/fire/storage';
import { Router } from '@angular/router';
import {
  Subscription,
  BehaviorSubject,
  Subject,
  timer,
  combineLatest,
} from 'rxjs';
import { map, takeUntil, take, debounceTime } from 'rxjs/operators';

// SERVICES
import { ArticleService } from '@services/article.service';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { UserService } from '@services/user.service';

// MODELS
import { ArticleDetailI } from '@shared_models/article.models';
import { CUserInfo } from '@models/user-info';
import { FirebaseService } from '@services/firebase.service';
import { SeoService } from '@services/seo.service';
import { StorageService } from '@services/storage.service';
import { Store } from '@ngrx/store';
import { hasAuthLoaded, isLoggedIn } from '@store/auth/auth.selectors';
import { PlatformService } from '@services/platform.service';
import {
  loadCurrentArticle,
  resetArticleState,
  updateCurrentArticle,
} from '@store/article/article.actions';

// STORE
import {
  currentArticleDetail,
  currentArticleTags,
  dbArticle,
  isArticleChanged,
} from '@store/article/article.selectors';

const BASE_ARTICLE = {
  articleId: '',
  authorId: '',
  title: ['', [Validators.required, Validators.maxLength(100)]],
  introduction: ['', [Validators.required, Validators.maxLength(300)]],
  body: 'This article is empty.',
  coverImageId: null,
  imageUrl: '',
  imageAlt: ['', Validators.maxLength(100)],
  authorImageUrl: '',
  lastUpdated: null,
  timestamp: 0,
  lastEditorId: '',
  version: 1,
  commentCount: 0,
  viewCount: 0,
  slug: '',
  tags: [[], Validators.maxLength(25)],
  isFeatured: false,
  editors: {},
  bodyImageIds: [],
};

@Component({
  selector: 'cos-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject();
  loggedInUser = new CUserInfo({ fName: null, lName: null });

  // Article State (from NgRX)
  currentArticleTags$ = this.store.select(currentArticleTags);
  dbArticle$ = this.store.select(dbArticle);

  // Cover Image State
  coverImageFile: File;

  coverImageUploadTask: AngularFireUploadTask;

  // Article State
  articleId: string;
  isArticleNew: boolean;
  doesArticleExist = true; // hacky and quick. Should really be defaulting to negative but I just want to add something for a non-found article real fast...
  currentArticleEditors = {};

  // Article Form State
  editSessionTimeoutSubscription: Subscription;

  articleEditForm: FormGroup = this.fb.group(BASE_ARTICLE);

  ECtrlNames = ECtrlNames; // Enum Availability in HTML Template
  ctrlBeingEdited: ECtrlNames = ECtrlNames.none;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private articleSvc: ArticleService,
    private userSvc: UserService,
    private authSvc: AuthService,
    private dialogSvc: DialogService,
    private seoSvc: SeoService,
    private fbSvc: FirebaseService,
    private storageSvc: StorageService,
    private store: Store,
    private platformSvc: PlatformService,
  ) {
    this.userSvc.loggedInUser$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(user => {
        this.loggedInUser = user;
      });
  }

  ngOnInit() {
    this.store.dispatch(loadCurrentArticle());
    this.dbArticle$.pipe(takeUntil(this.unsubscribe)).subscribe(article => {
      this.articleEditForm.patchValue(article);
      this.articleId = article.articleId;
    });
    // TESTING

    // this.store
    //   .select(currentArticleDetail)
    //   .pipe(takeUntil(this.unsubscribe))
    //   .subscribe(currentArticle => console.log({ currentArticle }));

    // this.store
    //   .select(dbArticle)
    //   .pipe(takeUntil(this.unsubscribe))
    //   .subscribe(dbArticle => console.log({ dbArticle }));

    combineLatest([
      this.store.select(dbArticle),
      this.store.select(currentArticleDetail),
    ]).subscribe(([dbArticle, currentArticle]) =>
      console.log({ dbArticle, currentArticle }),
    );

    this.store
      .select(currentArticleTags)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(tags => console.log('tags', tags));

    this.store
      .select(isArticleChanged)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(isEqual => console.log('isEqual', isEqual));

    // end testing

    this.watchFormChangesx();

    combineLatest([
      this.store.select(isLoggedIn),
      this.store.select(hasAuthLoaded),
    ]).subscribe(([isLoggedIn, hasAuthLoaded]) => {
      // ToDo: consider migrating platform tracking to NgRx too.
      const { isBrowser } = this.platformSvc;
      if (!isLoggedIn && !!hasAuthLoaded && isBrowser) {
        this.dialogSvc.openArticleCtaDialog();
      }
    });
  }

  ngOnDestroy() {
    this.store.dispatch(resetArticleState());
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.updateUserEditingStatus(false);
    this.cancelUpload(this.coverImageUploadTask);
  }

  cancelUpload = (task: AngularFireUploadTask) => {
    if (task) task.cancel();
  };

  watchArticleEditors = articleId =>
    this.articleSvc
      .currentEditorsRef(articleId)
      .snapshotChanges()
      .pipe(
        map(snapList => snapList.map(snap => snap.key)),
        takeUntil(this.unsubscribe),
      )
      .subscribe(keys => {
        const currentEditors = {};
        for (let key of keys) {
          currentEditors[key] = true;
        }
        this.currentArticleEditors = currentEditors;
      });

  watchFormChangesx = () =>
    this.articleEditForm.valueChanges
      .pipe(debounceTime(1000))
      .subscribe(change => {
        this.store.dispatch(updateCurrentArticle({ article: change }));
        if (this.articleEditForm.dirty) {
          this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
            if (isSignedIn) {
              if (!this.isUserEditingArticle()) {
                this.updateUserEditingStatus(true);
              }
            } else {
              this.dialogSvc.openMessageDialog(
                'Must be signed in',
                'You can not save changes without signing in or regisetering',
              );
            }
          });
        }
      });

  // ===end form setup & breakdown

  // ===EDITING STUFF
  updateUserEditingStatus = async (status: boolean) =>
    this.articleSvc.updateArticleEditStatus(
      this.articleId,
      this.authSvc.authInfo$.value.uid,
      status,
    );

  resetEditStates = () => {
    this.articleEditForm.markAsPristine();
    this.coverImageFile = null;
    this.activateCtrl(ECtrlNames.none);
    return this.updateUserEditingStatus(false);
  };

  selectCoverImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      this.articleEditForm.markAsDirty();
      this.articleEditForm.patchValue({ imageUrl: reader.result });
    };
    reader.readAsDataURL(file);
    this.coverImageFile = file;
  };

  changeBody = $e => {
    if ($e.source === 'user') {
      this.articleEditForm.markAsDirty();
      this.articleEditForm.patchValue({ body: $e.html });
    }
  };

  addBodyImage = (imageId: string) => {
    // Track images that were ever successfully uploaded on most recent
    // version in case we want to do some analytics to remove images
    // that were never added to any versions
    // const bodyImageIds = [...this.articleState.bodyImageIds];
    // bodyImageIds.push(imageId);
    // this.articleEditForm.patchValue({ bodyImageIds });
  };

  saveChanges = async () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (!isSignedIn) {
        this.dialogSvc.openMessageDialog(
          'Must be signed in',
          'You can not save changes without signing in or registering',
        );
        return;
      }
      const coverImageSub = this.saveCoverImage().subscribe(
        async ({ isReady, imageId }) => {
          if (!isReady) return;

          // update the id if cover image was changed
          // if (!!imageId) this.articleState.coverImageId = imageId;

          // if (this.articleState.articleId) {
          if (true) {
            // It's not new so just update existing and return
            try {
              const updateResult = await this.articleSvc.updateArticle(null);
              this.resetEditSessionTimeout();
              await this.resetEditStates();
              // HACKY: see associated note in UpdateArticle inside ArticleService
              if (updateResult && updateResult[2]) {
                this.router.navigate([`article/${updateResult[2]}`]);
              }
            } catch (error) {
              this.dialogSvc.openMessageDialog(
                'Error saving article',
                'Attempting to save your changes returned the following error',
                error.message || error,
              );
            } finally {
              if (coverImageSub) coverImageSub.unsubscribe();
              return;
            }
          } else {
            // It's a new article!
            try {
              // await this.articleSvc.createArticle(
              //   this.loggedInUser,
              //   this.articleState,
              //   this.articleId,
              // );
              this.resetEditSessionTimeout();
              // TODO: Ensure unsaved changes are actually being checked upon route change
              await this.resetEditStates(); // This could still result in race condition where real time updates are too slow.
              this.router.navigate([`article/${this.articleId}`]);
            } catch (error) {
              this.dialogSvc.openMessageDialog(
                'Error creating article',
                'Attempting to create the article returned the following error. If this persists, please let us know...',
                `Error: ${error.message || error}`,
              );
            } finally {
              if (coverImageSub) coverImageSub.unsubscribe();
              return;
            }
          }
        },
      );
    });
  };

  /**
   * Emits true if the process is complete (either the image was saved or there was nothing to save)
   * Emits false if it's incomplete or cancelled or errors out
   */
  saveCoverImage = () => {
    const isComplete$ = new BehaviorSubject({ isReady: false, imageId: null });
    if (!this.coverImageFile) {
      isComplete$.next({ isReady: true, imageId: null });
    } else {
      try {
        const { task, storageRef, newImageId } =
          this.articleSvc.uploadCoverImage(this.articleId, this.coverImageFile);

        this.coverImageUploadTask = task;
        task.then(() => {
          storageRef.getDownloadURL().subscribe(imageUrl => {
            this.articleEditForm.patchValue({ imageUrl });
            this.coverImageFile = null;
            isComplete$.next({ isReady: true, imageId: newImageId });
          });
        });

        this.dialogSvc
          .openProgressDialog(
            'Uploading new cover image',
            'You can hide this dialog while you wait, or cancel the upload to go back to editing',
            task.percentageChanges(),
          )
          .afterClosed()
          .subscribe(shouldCancel => {
            if (shouldCancel) {
              this.cancelUpload(this.coverImageUploadTask);
              this.articleEditForm.markAsDirty();
              isComplete$.next({ isReady: false, imageId: null });
            }
          });
      } catch (error) {
        console.error(error);
        isComplete$.next({ isReady: false, imageId: null });
      }
    }

    return isComplete$;
    // In the original we did more such as keeping track of uploads in the database and
  };

  // ---Editor Session Management
  setEditSessionTimeout = () => {
    if (this.editSessionTimeoutSubscription) this.resetEditSessionTimeout();

    // 300000 ms = 5 minutes
    this.editSessionTimeoutSubscription = timer(300000)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.openTimeoutDialog();
      });
  };

  resetEditSessionTimeout = () =>
    this.editSessionTimeoutSubscription.unsubscribe();

  openTimeoutDialog = () => {
    const response$ = this.dialogSvc.openTimeoutDialog(
      45,
      'Are you still there?',
      'Your changes will be discarded and the page will reload so that others can have a chance to make edits.',
      "I'm done. Discard my changes now",
      "I'm still working. Give me more time.",
    );

    response$.afterClosed().subscribe(shouldEndSession => {
      if (shouldEndSession) {
        this.resetEditStates();
        location.reload();
      } else this.setEditSessionTimeout();
    });
  };

  cancelChanges = () => {
    const response$ = this.dialogSvc
      .openConfirmDialog(
        'Undo Edits',
        'Any unsaved changes will be discarded and the page will refresh.',
        'Are you sure?',
      )
      .afterClosed();

    response$.subscribe(shouldCancel => {
      if (shouldCancel) {
        this.resetEditStates();
        location.reload();
      }
    });
  };

  // ===end editing stuff

  // ===UI DISPLAY
  activateCtrl = async (ctrl: ECtrlNames) => {
    if (!this.doesArticleExist) {
      this.dialogSvc.openMessageDialog(
        `You can't do that`,
        `Since this article doesn't exist you can not edit it.`,
      );
      return;
    }
    if (ctrl === ECtrlNames.none) {
      this.ctrlBeingEdited = ctrl;
      return;
    }
    // For now doesn't allow multiple editors. Will change later...
    if (!this.isUserEditingArticle() && this.isArticleBeingEdited()) {
      // Editors is an array so that we can later allow multiple collaborative editors.
      // For now we'll just check the first (only) element in the array
      const uid = Object.keys(this.currentArticleEditors)[0];
      this.userSvc
        .userRef(uid)
        .valueChanges()
        .pipe(take(1))
        .subscribe(user => {
          const cUser = new CUserInfo(user);
          this.dialogSvc.openMessageDialog(
            'Edit Locked',
            `The user "${cUser.displayName()}" is currently editing this article.`,
            'Please try again later.',
          );
        });
    } else {
      this.authSvc.isSignedInOrPrompt().subscribe(isLoggedIn => {
        if (isLoggedIn) {
          this.ctrlBeingEdited = ctrl;
        }
      });
    }
  };
  // ===end ui display

  // ===CONTROL HELPERS
  toggleCtrl = (ctrl: ECtrlNames) => {
    if (this.isCtrlActive(ctrl)) {
      this.activateCtrl(ECtrlNames.none);
      return;
    }
    this.activateCtrl(ctrl);
  };

  clickoutCtrl = (ctrl: ECtrlNames) => {
    if (ctrl === this.ctrlBeingEdited) {
      this.activateCtrl(ECtrlNames.none);
    }
  };

  isCtrlActive = (ctrl: ECtrlNames): boolean => {
    return this.ctrlBeingEdited === ctrl;
  };

  isUserEditingArticle = () =>
    !!this.currentArticleEditors[this.authSvc.authInfo$.value.uid];

  isArticleBeingEdited = () =>
    Object.keys(this.currentArticleEditors).length > 0;

  isBodyImageUploadPending = () => this.articleSvc.pendingImageUploadCount > 0;

  saveTooltipText = () => {
    if (!this.isUserEditingArticle())
      return 'No editors. This should not display. Let us know if it continues.';
    if (!this.articleEditForm.valid) return 'Fix errors to save';
    if (this.isBodyImageUploadPending()) return 'Images uploading, please wait';
    return 'Save Article';
  };

  // ===OTHER
  tempTimestamp = () => this.fbSvc.fsTimestampNow();

  updateMetaTags = (article: ArticleDetailI) => {
    const { title, introduction, body, tags, imageUrl } = article;
    const description = this.createMetaDescription(introduction, body);
    const keywords = tags.join(', ').toLowerCase();
    this.seoSvc.generateTags({ title, imageUrl, description, keywords });
  };

  createMetaDescription = (intro: string, body: string) => {
    const introLength = intro.length;
    if (introLength > 325) return intro.substr(0, 325).concat('...');
    const lengthToFill = 346 - introLength;
    const cleanBody = body
      .replace(/<\/?[^>]+(>|$)/g, ' ')
      .replace('&nbsp;', '')
      .replace(/\s+/g, ' ');
    return intro
      .concat(' - ')
      .concat(cleanBody.substr(0, lengthToFill))
      .concat('...');
  };
  // ===end other
}

// Types and Enums
export enum ECtrlNames {
  coverImage = 'coverImage',
  title = 'title',
  intro = 'intro',
  body = 'body',
  tags = 'tags',
  none = 'none',
}
