import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
} from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireUploadTask } from '@angular/fire/storage';
import { ActivatedRoute, Router } from '@angular/router';

import { Subscription, BehaviorSubject, Observable, Subject } from 'rxjs';
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

import { fsTimestampNow } from '@helpers/firebase';

// MODELS
import { ArticleDetail } from '@models/interfaces/article-info';
import { UserInfo } from '@models/classes/user-info';

const ARTICLE_STATE_KEY = makeStateKey<BehaviorSubject<ArticleDetail>>(
  'articleState'
);

@Component({
  selector: 'cos-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent implements OnInit, OnDestroy {
  // TODO: Consider switch to static: false https://angular.io/guide/static-query-migration
  @ViewChild('formBoundingBox', { static: false }) formBoundingBox;

  private unsubscribe: Subject<void> = new Subject();
  loggedInUser = new UserInfo({ fName: null, lName: null });

  //  // Cover Image State
  coverImageFile: File;

  coverImageUploadTask: AngularFireUploadTask;

  // Article State
  articleId: string;
  isArticleNew: boolean;
  articleSubscription: Subscription;
  currentArticleEditors = {};

  // Article Form State
  editSessionTimeout;
  saveButtonIsSticky = true;

  articleEditForm: FormGroup = this.fb.group({
    articleId: '',
    authorId: '',
    title: ['', [Validators.required, Validators.maxLength(100)]],
    introduction: ['', [Validators.required, Validators.maxLength(300)]],
    body: 'This article is empty.',
    bodyImages: {},
    imageUrl: '',
    imageAlt: ['', Validators.maxLength(100)],
    authorImageUrl: '',
    lastUpdated: null,
    timestamp: 0,
    lastEditorId: '',
    version: 1,
    commentCount: 0,
    viewCount: 0,
    tags: [[], Validators.maxLength(25)],
    isFeatured: false,
    editors: {},
  });

  articleState: ArticleDetail;

  CtrlNames = CtrlNames; // Enum Availability in HTML Template
  ctrlBeingEdited: CtrlNames = CtrlNames.none;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private state: TransferState,
    private articleSvc: ArticleService,
    private userSvc: UserService,
    private authSvc: AuthService,
    private dialogSvc: DialogService
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
        ({ id, isNew }): Observable<ArticleDetail> => {
          if (isNew) {
            return Observable.create(observer => {
              observer.next(this.articleEditForm.value);
              observer.complete();
            });
          } else return this.watchArticle$(id);
        }
      )
    );
    article$.pipe(takeUntil(this.unsubscribe)).subscribe(article => {
      this.articleState = article;
      if (article) this.articleEditForm.patchValue(article);
    });
  };

  watchArticleIdAndStatus$ = () => {
    return this.route.params.pipe(
      map(params => {
        if (params['id']) return { id: params['id'], isNew: false };
        else return { id: this.articleSvc.createArticleId(), isNew: true };
      })
    );
  };

  watchArticle$ = id => {
    const preExisting: ArticleDetail = this.state.get(
      ARTICLE_STATE_KEY,
      null as any
    );
    const article$ = this.articleSvc
      .articleDetailRef(id)
      .valueChanges()
      .pipe(
        map(article =>
          article
            ? (this.articleSvc.processArticleTimestamps(
                article
              ) as ArticleDetail)
            : null
        ),
        tap(article => this.state.set(ARTICLE_STATE_KEY, article)),
        startWith(preExisting)
      );
    //   .subscribe(articleData => {
    //     article$.next(articleData);
    //     // this.updateMetaData(articleData);
    //     // this.ckeditor.content = articleData
    //     //   ? articleData.body
    //     //   : this.ckeditor.placeholder;
    //     // this.setFormData(articleData);
    //   });
    return article$;
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
  updateUserEditingStatus = (status: boolean) => {
    this.articleSvc.updateArticleEditStatus(
      this.articleId,
      this.loggedInUser.uid,
      status
    );
  };

  resetEditStates = () => {
    this.updateUserEditingStatus(false);
    // this.currentArticleEditors[this.loggedInUser.uid] = false;
    this.articleEditForm.markAsPristine();
    // this.coverImageFile = null;

    this.activateCtrl(CtrlNames.none);
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

  selectCoverImage = file => {
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
              this.loggedInUser,
              this.articleState
            );
            clearTimeout(this.editSessionTimeout);
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
            clearTimeout(this.editSessionTimeout);
            // TODO: Ensure unsaved chanes are actually being checked upon route change
            this.resetEditStates(); // Unsaved chagnes checked upon route change
            this.router.navigate([`article/${this.articleId}`]);
          } catch (error) {
            this.dialogSvc.openMessageDialog(
              'Error creating article',
              'Attempting to create the article returned the following error. If this persists, please let us know...',
              `Error: ${error.message || error}`
            );
          } finally {
            coverImageSub.unsubscribe();
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
          ref.getDownloadURL().subscribe(url => {
            this.articleEditForm.patchValue({ imageUrl: url });
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
    clearTimeout(this.editSessionTimeout);
    this.editSessionTimeout = setTimeout(() => {
      this.openTimeoutDialog();
    }, 300000);
  };

  openTimeoutDialog = () => {
    // this.dialogIsOpen.next(true);
    // const dialogConfig = new MatDialogConfig();
    // dialogConfig.disableClose = true;

    // const dialogRef = this.dialog.open(
    //   EditTimeoutDialogComponent,
    //   dialogConfig
    // );
    // dialogRef.afterClosed().subscribe(res => {
    //   this.dialogIsOpen.next(false);
    //   const editorIsActive = res ? res : false;
    //   if (editorIsActive) {
    //     this.setEditSessionTimeout();
    //   } else {
    //     this.endEditSession();
    //   }
    // });
    this.dialogSvc
      .openTimeoutDialog()
      .afterClosed()
      .subscribe(res => {
        if (res) this.setEditSessionTimeout();
        else this.endEditSession();
      });
  };

  endEditSession() {
    // this.dialogIsOpen.next(true);
    this.dialogSvc
      // TODO: Implement edit session dialogs
      .openMessageDialog(
        'just for now',
        'Have not implemented edit session dialogs',
        'Do the thing and separate concerns'
      )
      .afterClosed()
      .subscribe(() => {
        // this.dialogIsOpen.next(false);
        this.resetEditStates();
        this.router.navigate(['home']);
      });
  }
  // ===end editing stuff

  // ===UI DISPLAY
  activateCtrl = async (ctrl: CtrlNames) => {
    if (ctrl === CtrlNames.none) {
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
          user = new UserInfo(user);
          this.dialogSvc.openMessageDialog(
            'Edit Locked',
            `The user "${user.displayName()}" is currently editing this article.`,
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

  tempTimestamp = () => fsTimestampNow();
  // ===CONTROL HELPERS
  toggleCtrl = (ctrl: CtrlNames) => {
    if (this.isCtrlActive(ctrl)) {
      this.activateCtrl(CtrlNames.none);
      return;
    }
    this.activateCtrl(ctrl);
  };

  clickoutCtrl = (ctrl: CtrlNames) => {
    if (ctrl === this.ctrlBeingEdited) {
      this.activateCtrl(CtrlNames.none);
    }
  };

  isCtrlActive = (ctrl: CtrlNames): boolean => {
    return this.ctrlBeingEdited === ctrl;
  };

  isUserEditingArticle = () =>
    !!this.currentArticleEditors[this.loggedInUser.uid];

  isArticleBeingEdited = () =>
    Object.keys(this.currentArticleEditors).length > 0;
}

// Types and Enums
export enum CtrlNames {
  coverImage = 'coverImage',
  title = 'title',
  intro = 'intro',
  body = 'body',
  tags = 'tags',
  none = 'none',
}
