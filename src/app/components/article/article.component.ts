import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireUploadTask } from '@angular/fire/storage';
import { Subscription, Subject, timer, combineLatest } from 'rxjs';
import {
  map,
  takeUntil,
  take,
  debounceTime,
  first,
  tap,
  startWith,
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
import { Store } from '@ngrx/store';
import { hasAuthLoaded, isLoggedIn } from '@store/auth/auth.selectors';
import { PlatformService } from '@services/platform.service';
import {
  loadCurrentArticle,
  resetArticleState,
  saveArticleChanges,
  undoArticleEdits,
  updateCurrentArticle,
} from '@store/article/article.actions';

// STORE
import {
  currentArticleId,
  dbArticle,
  isArticleChanged,
  isArticleNew,
} from '@store/article/article.selectors';
import { makeStateKey, TransferState } from '@angular/platform-browser';

const BASE_ARTICLE_FORM = {
  articleId: '',
  authorId: '',
  title: ['', [Validators.required, Validators.maxLength(100)]],
  introduction: ['', [Validators.required, Validators.maxLength(300)]],
  body: 'This article is empty.',
  imageUrl: '',
  coverImageId: '',
  imageAlt: ['', Validators.maxLength(100)],
  // Would like to remove authorImageUrl but would require data cleanup
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

const CURRENT_ARTICLE_STATE_KEY =
  makeStateKey<ArticleDetailI>('currentArticle');

@Component({
  selector: 'cos-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent implements OnInit, OnDestroy {
  private unsubscribe$: Subject<void> = new Subject();

  isLoggedIn$ = this.store.select(isLoggedIn);

  // Article State (from NgRX)
  dbArticle$ = this.store.select(dbArticle).pipe(takeUntil(this.unsubscribe$));
  currentArticleId$ = this.store
    .select(currentArticleId)
    .pipe(takeUntil(this.unsubscribe$));
  isArticleNew$ = this.store
    .select(isArticleNew)
    .pipe(takeUntil(this.unsubscribe$));
  isArticleChanged$ = this.store
    .select(isArticleChanged)
    .pipe(takeUntil(this.unsubscribe$));

  // Article State (more static)
  currentArticle: ArticleDetailI;
  articleId: string;
  isArticleNew: boolean;
  wasArticleLoadDispatched = false;
  doesArticleExist = true; // hacky and quick. Should really be defaulting to negative but I just want to add something for a non-found article real fast...
  currentArticleEditors = {};

  // Article Form State
  editSessionTimeoutSubscription: Subscription;
  articleEditForm: FormGroup = this.fb.group(BASE_ARTICLE_FORM);
  ECtrlNames = ECtrlNames; // Enum Availability in HTML Template
  ctrlBeingEdited: ECtrlNames = ECtrlNames.none;

  // Cover Image State
  coverImageFile: File;
  coverImageUploadTask: AngularFireUploadTask;

  constructor(
    private fb: FormBuilder,
    private articleSvc: ArticleService,
    private userSvc: UserService,
    private authSvc: AuthService,
    private dialogSvc: DialogService,
    private seoSvc: SeoService,
    private fbSvc: FirebaseService,
    private store: Store,
    private platformSvc: PlatformService,
    private state: TransferState,
  ) {}

  ngOnInit() {
    if (!this.state.get(CURRENT_ARTICLE_STATE_KEY, null)) {
      this.dispatchArticleLoading();
    }
    this.watchDbArticle();

    this.watchArticleId();

    this.watchNewness();

    this.watchFormChanges();

    this.initiateAuthCta();

    // TESTING

    // this.dbArticle$.subscribe(art => console.log('dbArticle:', art));
    // this.ssrDbArticle$().subscribe(art => console.log('ssrDbArt:', art));

    // end testing
  }

  ngOnDestroy() {
    this.store.dispatch(resetArticleState());
    this.state.remove(CURRENT_ARTICLE_STATE_KEY);
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.updateUserEditingStatus(false);
    this.cancelUpload(this.coverImageUploadTask);
  }

  // === ARTICLE SETUP

  dispatchArticleLoading = () => {
    if (!this.wasArticleLoadDispatched) {
      this.store.dispatch(loadCurrentArticle());
      this.wasArticleLoadDispatched = true;
    }
  };
  ssrDbArticle$ = () => {
    const preExisting = this.state.get(CURRENT_ARTICLE_STATE_KEY, null);

    return this.dbArticle$.pipe(
      first(article => !!article),
      tap(article => this.state.set(CURRENT_ARTICLE_STATE_KEY, article)),
      startWith(preExisting),
    );
  };

  watchDbArticle = () => {
    this.ssrDbArticle$().subscribe(dbArticle => {
      this.articleEditForm.patchValue(dbArticle);
      this.currentArticle = dbArticle;
    });
  };

  watchArticleId = () =>
    this.currentArticleId$.subscribe(id => (this.articleId = id));

  watchNewness = () =>
    this.isArticleNew$.subscribe(isNew => (this.isArticleNew = isNew));

  // === end article setup

  initiateAuthCta = () =>
    combineLatest([
      this.store.select(isLoggedIn),
      this.store.select(hasAuthLoaded),
    ])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([isLoggedIn, hasAuthLoaded]) => {
        // ToDo: consider migrating platform tracking to NgRx too.
        const { isBrowser } = this.platformSvc;
        if (!isLoggedIn && !!hasAuthLoaded && isBrowser) {
          this.dialogSvc.openArticleCtaDialog();
        }
      });

  watchArticleEditors = articleId =>
    this.articleSvc
      .currentEditorsRef(articleId)
      .snapshotChanges()
      .pipe(
        map(snapList => snapList.map(snap => snap.key)),
        takeUntil(this.unsubscribe$),
      )
      .subscribe(keys => {
        const currentEditors = {};
        for (let key of keys) {
          currentEditors[key] = true;
        }
        this.currentArticleEditors = currentEditors;
      });

  watchFormChanges = () =>
    this.articleEditForm.valueChanges
      .pipe(debounceTime(1000))
      .subscribe(change => {
        this.store.dispatch(updateCurrentArticle({ article: change }));
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
                'You can not save changes without signing in or regisetering',
              );
            }
          });
        }
      });

  // ===end form setup & breakdown

  // ===EDITING STUFF
  cancelUpload = (task: AngularFireUploadTask) => {
    if (task) task.cancel();
  };

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

  saveChanges = () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      // Could do some or all of that isSignedInOrPrompt stuff in the NgRx flow
      if (!isSignedIn) {
        this.dialogSvc.openMessageDialog(
          'Must be signed in',
          'You can not save changes without signing in or registering',
        );

        return;
      }
      this.store.dispatch(saveArticleChanges());
      // !These should be done more synchronously, probably in the effects.
      this.resetEditStates().then(() => this.resetEditSessionTimeout());

      return;
    });
  };

  // ---Editor Session Management
  setEditSessionTimeout = () => {
    if (this.editSessionTimeoutSubscription) this.resetEditSessionTimeout();

    // 300000 ms = 5 minutes
    this.editSessionTimeoutSubscription = timer(300000)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.openTimeoutDialog();
      });
  };

  resetEditSessionTimeout = () =>
    this.editSessionTimeoutSubscription?.unsubscribe();

  openTimeoutDialog = () => {
    const response$ = this.dialogSvc.openTimeoutDialog(
      60,
      'Are you still there?',
      'Your changes will be discarded and the page will reload so that others can have a chance to make edits.',
      "I'm done. Discard my changes now",
      "I'm still working. Give me more time.",
    );

    response$.afterClosed().subscribe(shouldEndSession => {
      if (shouldEndSession) {
        this.undoAllEdits();
      } else this.setEditSessionTimeout();
    });
  };

  cancelChanges = () => {
    const response$ = this.dialogSvc
      .openConfirmDialog(
        'Undo Edits',
        'Any unsaved changes will be discarded.',
        'Are you sure?',
      )
      .afterClosed();

    response$.subscribe(shouldCancel => {
      if (shouldCancel) {
        this.undoAllEdits();
      }
    });
  };

  undoAllEdits = () => {
    this.store.dispatch(undoArticleEdits());
    this.store
      .select(dbArticle)
      .pipe(take(1))
      .subscribe(article => this.articleEditForm.patchValue(article));
    this.resetEditStates();
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
          this.dispatchArticleLoading();
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
