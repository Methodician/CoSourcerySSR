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
import { ActivatedRoute } from '@angular/router';

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

  @HostListener('window:scroll')
  onScroll() {
    this.setStickySaveButton();
  }

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
  isFormInCreateView: boolean;
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
          this.isFormInCreateView = true;
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
    //   // this.ckeditor.config.fbImageStorage = {
    //   //   storageRef: this.articleSvc.createVanillaStorageRef(
    //   //     `articleBodyImages/${this.articleId}/`
    //   //   ),
    //   // };
    // });
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

  selectCoverImage = file => {
    const reader = new FileReader();
    reader.onload = () => {
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
    // if (this.coverImageFile) {
    //   await this.saveCoverImage();
    //   this.coverImageFile = null;
    // }
    // if (!this.articleState.articleId) {
    //   // Create New Article
    //   try {
    //     await this.articleSvc.createArticle(
    //       this.loggedInUser,
    //       this.articleState,
    //       this.articleId,
    //     );
    //     this.articleIsNew = false;
    //     clearTimeout(this.editSessionTimeout);
    //     this.resetEditStates(); // Unsaved changes checked upon route change
    //     this.router.navigate([`article/${this.articleId}`]);
    //   } catch (error) {
    //     this.openMessageDialog(
    //       'Save Error',
    //       'Oops! There was a problem saving your article.',
    //       `Error: ${error}`,
    //     );
    //   }
    // } else {
    // Update Existing Article
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn) {
        if (this.coverImageFile) {
          // save cover image because it was changed
          this.saveCoverImage().subscribe(percentChanges => {
            // TODO: Use mat-progress-bar in a new progress modal to show progress
            console.log('cover image upload progress', percentChanges);
          });
        }
        if (this.articleState.articleId) {
          // It's not new so just update existing and return
          try {
            this.articleSvc.updateArticle(this.loggedInUser, this.articleState);
            clearTimeout(this.editSessionTimeout);
            this.resetEditStates();
          } catch (error) {
            this.dialogSvc.openMessageDialog(
              'Error saving article',
              'Attempting to save your changes returned the following error',
              error.message || error
            );
          }
          return;
        }
        // There wasn't an articleId so this is new...
        // Create new article.
      } else
        this.dialogSvc.openMessageDialog(
          'Must be signed in',
          'You can not save changes without signing in or registering'
        );
    });
  };

  saveCoverImage = () => {
    const { task, ref } = this.articleSvc.uploadCoverImage(
      this.articleId,
      this.coverImageFile
    );
    this.coverImageUploadTask = task;
    task.then(() => {
      ref.getDownloadURL().subscribe(url => {
        this.articleEditForm.patchValue({ imageUrl: url });
      });
    });
    return task.percentageChanges();
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
        console.log('after close timeout dialog', res);
        if (res) this.setEditSessionTimeout();
        else this.endEditSession();
      });
  };

  endEditSession() {
    // this.dialogIsOpen.next(true);
    // const dialogRef = this.openMessageDialog(
    //   'Session Timeout',
    //   'Your changes have been discarded.'
    // );
    // dialogRef.afterClosed().subscribe(() => {
    //   this.dialogIsOpen.next(false);
    //   this.resetEditStates();
    //   this.router.navigate(['home']);
    // });
    this.dialogSvc
      .openMessageDialog(
        'just for now',
        'Have not implemented edit session dialogs',
        'Do the thing and separate concerns'
      )
      .afterClosed()
      .subscribe(() => {
        console.log('closed the dialog');
        this.resetEditStates();
      });
  }
  // ===end editing stuff

  // ===UI DISPLAY
  activateCtrl = async (ctrl: CtrlNames) => {
    console.log('activating', ctrl);
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

  setStickySaveButton = () => {
    // ToDo: Ask yourself: do we really want it to stick?
    if (!this.formBoundingBox) return;
    const formBottomOffset = this.formBoundingBox.nativeElement.getBoundingClientRect()
      .bottom;
    const verticalOverflow = formBottomOffset - window.innerHeight;
    this.saveButtonIsSticky = verticalOverflow > 0 ? true : false;
  };
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
