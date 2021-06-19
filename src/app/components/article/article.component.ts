import { Component, OnInit, OnDestroy } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireUploadTask } from '@angular/fire/storage';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Subscription,
  BehaviorSubject,
  Observable,
  Subject,
  timer,
  of,
  Observer,
  combineLatest,
} from 'rxjs';
import {
  tap,
  map,
  startWith,
  switchMap,
  takeUntil,
  take,
} from 'rxjs/operators';

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
import { loadCurrentArticle } from '@store/article/article.actions';

// STORE
import { selectArticle } from '@store/article/article.selectors';

const ARTICLE_STATE_KEY = makeStateKey<ArticleDetailI>('articleState');

const BASE_ARTICLE = {
  articleId: '',
  authorId: '',
  title: ['', [Validators.required, Validators.maxLength(100)]],
  introduction: ['', [Validators.required, Validators.maxLength(300)]],
  body: 'This article is empty.',
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

  // Cover Image State
  coverImageFile: File;

  coverImageUploadTask: AngularFireUploadTask;

  // Article State
  articleState: ArticleDetailI;
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
    private route: ActivatedRoute,
    private router: Router,
    private state: TransferState,
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
    // TESTING
    this.store.select(selectArticle).subscribe(console.log);
    // end testing
    this.initializeArticleIdAndState();
    this.watchFormChanges();

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
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.updateUserEditingStatus(false);
    this.state.set(ARTICLE_STATE_KEY, null);
    this.cancelUpload(this.coverImageUploadTask);
  }

  cancelUpload = (task: AngularFireUploadTask) => {
    if (task) task.cancel();
  };

  // FORM SETUP & BREAKDOWN
  initializeArticleIdAndState = () => {
    const article$ = this.watchArticleIdAndStatus$().pipe(
      tap(({ id, isNew }) => {
        if (!!id) {
          this.watchArticleEditors(id);
        }
        if (id) this.articleId = id;
        if (isNew) {
          this.isArticleNew = true;
        } else this.isArticleNew = false;
      }),
      switchMap(({ id, isNew }): Observable<ArticleDetailI> => {
        this.store.dispatch(loadCurrentArticle({ articleId: id }));
        if (isNew) {
          return new Observable((observer: Observer<ArticleDetailI>) => {
            observer.next(this.articleEditForm.value);
            observer.complete();
          });
        } else return this.watchArticle$(id);
      }),
    );

    article$.pipe(takeUntil(this.unsubscribe)).subscribe(article => {
      this.articleState = article;
      if (article) {
        this.articleEditForm.patchValue(article);
        this.watchCoverImageUrl(article);
        this.updateMetaTags(article);
      }
    });
  };

  watchArticleIdAndStatus$: () => Observable<{
    id: any;
    isNew: boolean;
  }> = () =>
    this.route.params.pipe(
      switchMap(params => {
        let status$ = of({ id: null, isNew: false });
        if (params['id']) {
          status$ = this.articleSvc
            .getIdFromSlugOrId(params['id'])
            .pipe(map(id => ({ id, isNew: false })));
        } else {
          status$ = of({ id: this.articleSvc.createId(), isNew: true });
        }
        return status$;
      }),
    );

  watchArticle$ = id => {
    const preExisting: ArticleDetailI = this.state.get(
      ARTICLE_STATE_KEY,
      null as any,
    );

    const notFoundArticle: ArticleDetailI = {
      articleId: 'fake-news',
      authorId: '',
      authorImageUrl: '../../assets/images/feeling-lost.jpg',
      body: 'No article exists for the route supplied. Please return to home by clicking the CoSourcery icon in the upper left.',
      coverImageId: '',
      editors: null,
      imageAlt: '',
      imageUrl: '../../assets/images/feeling-lost.jpg',
      introduction: 'The article you seek is a mirage.',
      lastEditorId: '',
      lastUpdated: new Date(),
      slug: 'no-existing-article',
      timestamp: new Date(),
      title: 'Fake News',
      version: 0,
      commentCount: 0,
      tags: ['FAKE', 'MADE UP', 'UNREAL', 'STUB', 'BAD ROUTE'],
      bodyImageIds: [],
    };
    const article$ = this.articleSvc
      .articleDetailRef(id)
      .valueChanges()
      .pipe(
        map(article => {
          if (article) {
            return this.articleSvc.processArticleTimestamps(
              article,
            ) as ArticleDetailI;
          }
          this.doesArticleExist = false;
          return notFoundArticle;
        }),
        tap(article => this.state.set(ARTICLE_STATE_KEY, article)),
        startWith(preExisting),
      );
    return article$;
  };

  watchCoverImageUrl = (article: ArticleDetailI) => {
    const { coverImageId, articleId } = article;
    if (coverImageId && coverImageId !== '') {
      this.storageSvc
        .getImageUrl(`articleCoverImages/${articleId}/${coverImageId}`)
        .subscribe(url => {
          this.articleState.imageUrl = url;
        });
    }
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

  watchFormChanges = () => {
    this.articleEditForm.valueChanges.subscribe(change => {
      this.articleState = change;
      if (this.articleEditForm.dirty) {
        this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
          if (isSignedIn) {
            this.setEditSessionTimeout();
            if (!this.isUserEditingArticle()) {
              this.updateUserEditingStatus(true);
            }
          } else {
            this.dialogSvc.openMessageDialog(
              'Must be signed in',
              'You can not save changes without signing in or registering',
            );
          }
        });
      }
    });
  };
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

  addTag = (tag: string) => {
    this.articleState.tags.push(tag);
    this.articleEditForm.markAsDirty();
    this.articleEditForm.patchValue({ tags: this.articleState.tags });
  };

  /**
   * Expects the index of an article tag.
   *
   * Removes that tag, patches the form, marks form as dirty
   */
  removeTag = (tagIndex: number) => {
    const tags = this.articleState.tags;
    tags.splice(tagIndex, 1);
    this.articleEditForm.markAsDirty();
    this.articleEditForm.patchValue({ tags });
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
    const bodyImageIds = [...this.articleState.bodyImageIds];
    bodyImageIds.push(imageId);
    this.articleEditForm.patchValue({ bodyImageIds });
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
          if (!!imageId) this.articleState.coverImageId = imageId;

          if (this.articleState.articleId) {
            // It's not new so just update existing and return
            try {
              const updateResult = await this.articleSvc.updateArticle(
                this.articleState,
              );
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
              await this.articleSvc.createArticle(
                this.loggedInUser,
                this.articleState,
                this.articleId,
              );
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
