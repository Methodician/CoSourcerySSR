import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireUploadTask } from '@angular/fire/storage';
import { ActivatedRoute, Router } from '@angular/router';

import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  timer,
} from 'rxjs';
import {
  map,
  startWith,
  switchMap,
  tap,
  take,
  takeUntil,
} from 'rxjs/operators';

// SERVICES
import { ArticleService } from '@services/article.service';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { SeoService } from '@services/seo.service';
import { UserService } from '@services/user.service';

import { fsTimestampNow } from '@helpers/firebase';

// MODELS
import { CUserInfo } from '@models/user-info';
import { IArticleDetail } from '@models/article-info';

const ARTICLE_STATE_KEY = makeStateKey<BehaviorSubject<IArticleDetail>>(
  'articleState'
);

const ARTICLE_VERSION_STATE_KEY = makeStateKey<BehaviorSubject<IArticleDetail>>(
  'articleVersionState'
);

@Component({
  selector: 'cos-article',
  styleUrls: ['./article.component.scss'],
  templateUrl: './article.component.html',
})
export class ArticleComponent implements OnInit, OnDestroy {
  // TODO: Consider switch to static: false https://angular.io/guide/static-query-migration
  @ViewChild('formBoundingBox', { static: false }) formBoundingBox;

  private unsubscribe: Subject<void> = new Subject();
  loggedInUser = new CUserInfo({ fName: null, lName: null });

  //  Cover Image State
  coverImageFile: File;

  coverImageUploadTask: AngularFireUploadTask;

  // Article State
  articleId: string;
  articleSubscription: Subscription;
  currentArticleEditors = {};
  isArticleNew: boolean;

  // Article Form State
  editSessionTimeoutSubscription: Subscription;

  articleEditForm: FormGroup = this.fb.group({
    articleId: '',
    authorId: '',
    authorImageUrl: '',
    body: 'This article is empty.',
    bodyImages: {},
    commentCount: 0,
    editors: {},
    imageUrl: '',
    imageAlt: ['', Validators.maxLength(100)],
    introduction: ['', [Validators.required, Validators.maxLength(300)]],
    isFeatured: false,
    lastEditorId: '',
    lastUpdated: null,
    tags: [[], Validators.maxLength(25)],
    timestamp: 0,
    title: ['', [Validators.required, Validators.maxLength(100)]],
    version: 1,
    viewCount: 0,
  });

  articleState: IArticleDetail;

  ECtrlNames = ECtrlNames; // Enum Availability in HTML Template
  ctrlBeingEdited: ECtrlNames = ECtrlNames.none;

  constructor(
    private articleSvc: ArticleService,
    private authSvc: AuthService,
    private dialogSvc: DialogService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private seoSvc: SeoService,
    private state: TransferState,
    private userSvc: UserService,
  ) {
    this.userSvc.loggedInUser$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(user => {
        this.loggedInUser = user;
      });
  }

  ngOnInit() {
    this.initializeArticleIdAndState();
    this.watchArticleEditors();
    this.watchFormChanges();
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
        if (id) this.articleId = id;
        if (isNew) {
          this.isArticleNew = true;
        } else this.isArticleNew = false;
      }),
      switchMap(
        ({ id, version, isNew }): Observable<IArticleDetail> => {
          if (isNew) {
            return Observable.create(observer => {
              observer.next(this.articleEditForm.value);
              observer.complete();
            });
          } else return this.watchArticle$(id, version);
        }
      )
    );
    article$.pipe(takeUntil(this.unsubscribe)).subscribe(article => {
      this.articleState = article;
      if (article) {
        this.articleEditForm.patchValue(article);
        this.updateMetaTags(article);
      }
    });
  };

  watchArticleIdAndStatus$ = () => {
    return this.route.params.pipe(
      map(params => {
        if (params['id'] && params['version'] ) return { id: params['id'], version: params['version'], isNew: false };
        else if (params['id']) return { id: params['id'], isNew: false };
        else return { id: this.articleSvc.createArticleId(), isNew: true };
      })
    );
  };

  watchArticle$ = (id, articleVersion) => {
    const preExisting: IArticleDetail = this.state.get(
      ARTICLE_VERSION_STATE_KEY,
      null as any
    );
    if(articleVersion) {
      const article$ = this.articleSvc
        .articleVersionDetailRef(id, articleVersion)
        .valueChanges()
        .pipe(
          map(article =>
            article
              ? (this.articleSvc.processArticleTimestamps(
                article
              ) as IArticleDetail)
              : null
          ),
          tap(article => this.state.set(ARTICLE_VERSION_STATE_KEY, article)),
          startWith(preExisting)
        );
      return article$;
    } else {
      const article$ = this.articleSvc
        .articleDetailRef(id)
        .valueChanges()
        .pipe(
          map(article =>
            article
              ? (this.articleSvc.processArticleTimestamps(
                article
              ) as IArticleDetail)
              : null
          ),
          tap(article => this.state.set(ARTICLE_STATE_KEY, article)),
          startWith(preExisting)
        );
      return article$;
    }
  };

  watchArticleEditors = () => {
    this.articleSvc
      .currentEditorsRef(this.articleId)
      .snapshotChanges()
      .pipe(
        map(snapList => snapList.map(snap => snap.key)),
        takeUntil(this.unsubscribe)
      )
      .subscribe(keys => {
        const currentEditors = {};
        for (let key of keys) {
          currentEditors[key] = true;
        }
        this.currentArticleEditors = currentEditors;
      });
  };

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
              'You can not save changes without signing in or registering'
            );
          }
        });
      }
    });
  };
  // ===end form setup & breakdown

  // ===EDITING STUFF
  updateUserEditingStatus = (status: boolean) => this.articleSvc.updateArticleEditStatus(
    this.articleId,
    this.loggedInUser.uid,
    status
  );

  resetEditStates = () => {
    this.articleEditForm.markAsPristine();
    // this.coverImageFile = null;  
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

  changeBody = body => {
    this.articleEditForm.markAsDirty();
    this.articleEditForm.patchValue({ body });
  };

  saveChanges = async () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (!isSignedIn) {
        this.dialogSvc.openMessageDialog(
          'Must be signed in',
          'You can not save changes without signing in or registering'
        );
        return;
      }
      const coverImageSub = this.saveCoverImage().subscribe(async isReady => {
        if (!isReady) return;

        if (this.articleState.articleId) {
          // It's not new so just update existing and return
          try {
            await this.articleSvc.updateArticle(
              this.articleState
            );
            this.resetEditSessionTimeout();
            this.resetEditStates();
          } catch (error) {
            this.dialogSvc.openMessageDialog(
              'Error saving article',
              'Attempting to save your changes returned the following error',
              error.message || error
            );
          } finally {
            coverImageSub.unsubscribe();
            return;
          }
        } else {
          // It's a new article!
          try {
            await this.articleSvc.createArticle(
              this.loggedInUser,
              this.articleState,
              this.articleId
            );
            this.resetEditSessionTimeout();
            // TODO: Ensure unsaved changes are actually being checked upon route change
            await this.resetEditStates(); // This could still result in race condition where real time updates are too slow.
            this.router.navigate([`article/${this.articleId}`]);
          } catch (error) {
            this.dialogSvc.openMessageDialog(
              'Error creating article',
              'Attempting to create the article returned the following error. If this persists, please let us know...',
              `Error: ${error.message || error}`
            );
          } finally {
            if (coverImageSub) coverImageSub.unsubscribe();
            return;
          }
        }
      });
    });
  };

  /**
   * Emits true if the process is complete (either the image was saved or there was nothing to save)
   * Emits false if it's incomplete or cancelled or errors out
   */
  saveCoverImage = () => {
    const isComplete$ = new BehaviorSubject(false);
    if (!this.coverImageFile) {
      isComplete$.next(true);
    } else {
      try {
        const { task, ref } = this.articleSvc.uploadCoverImage(
          this.articleId,
          this.coverImageFile
        );

        this.coverImageUploadTask = task;
        task.then(() => {
          ref.getDownloadURL().subscribe(imageUrl => {
            this.articleEditForm.patchValue({ imageUrl });
            this.coverImageFile = null;
            isComplete$.next(true);
          });
        });

        this.dialogSvc
          .openProgressDialog(
            'Uploading new cover image',
            'You can hide this dialog while you wait, or cancel the upload to go back to editing',
            task.percentageChanges()
          )
          .afterClosed()
          .subscribe(shouldCancel => {
            if (shouldCancel) {
              this.cancelUpload(this.coverImageUploadTask);
              this.articleEditForm.markAsDirty();
              isComplete$.next(false);
            }
          });
      } catch (error) {
        console.error(error);
        isComplete$.next(false);
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
      "I'm still working. Give me more time."
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
        'Are you sure?'
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
    if (ctrl === ECtrlNames.none) {
      this.ctrlBeingEdited = ctrl;
      return;
    }
    // For now doesn't allow multiple editors. Will change later...
    if (!this.isUserEditingArticle() && this.isArticleBeingEdited()) {
      // Editors is an array so that we can later allow multilple collaborative editors.
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
            'Please try again later.'
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
    !!this.currentArticleEditors[this.loggedInUser.uid];

  isArticleBeingEdited = () =>
    Object.keys(this.currentArticleEditors).length > 0;

  // ===OTHER
  tempTimestamp = () => fsTimestampNow();

  updateMetaTags = (article: IArticleDetail) => {
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
