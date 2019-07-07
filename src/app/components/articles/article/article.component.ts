import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  TransferState,
  makeStateKey,
  StateKey,
} from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticleService } from '@services/article.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ArticleDetail } from '@models/interfaces/article-info';
import { UserInfo } from '@models/classes/user-info';
import { UserService } from '@services/user.service';
import { DialogService } from '@services/dialog.service';

import { Subscription, BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  tap,
  map,
  startWith,
  switchMap,
  takeUntil,
  take,
} from 'rxjs/operators';
import { AuthService } from '@services/auth.service';

const ARTICLE_STATE_KEY = makeStateKey<BehaviorSubject<ArticleDetail>>(
  'articleState'
);

@Component({
  selector: 'cos-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject();
  loggedInUser = new UserInfo({ fName: null, lName: null });

  //  // Cover Image State
  //  coverImageFile: File;
  //  shouldAbortTempCoverImage = false;
  //  coverImageUploadTask: AngularFireUploadTask;
  //  coverImageUploadPercent$: Observable<number>;
  //  coverImageUrl$ = new BehaviorSubject<string>(null);

  // Article State
  articleId: string;
  isArticleNew: boolean;
  // articleIsBookmarked: boolean;
  articleSubscription: Subscription;
  // articleEditorSubscription: Subscription;
  currentArticleEditors = {};

  // Article Form State
  isFormInCreateView: boolean;
  // articleEditFormSubscription: Subscription;
  // editSessionTimeout;
  // saveButtonIsSticky = true;

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
    this.removeUserEditingStatus();
    this.state.set(ARTICLE_STATE_KEY, null);
  }

  // Form Setup & Breakdown
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
      .subscribe(keys => console.log(keys));
  };

  watchFormChanges = () => {
    this.articleEditForm.valueChanges.subscribe(change => {
      console.log(this.articleEditForm.dirty);
      this.articleState = change;
      if (this.articleEditForm.dirty) {
        // this.setEditSessionTimeout();
        // if (!this.isUserEditingArticle()) {
        this.addUserEditingStatus();
        // }
      }
    });
  };

  // UI Display
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

  // EDITING HELPERS
  addUserEditingStatus = () => {
    this.articleSvc.updateArticleEditStatus(
      this.articleId,
      this.loggedInUser.uid,
      true
    );
  };

  removeUserEditingStatus = () => {
    this.articleSvc.updateArticleEditStatus(
      this.articleId,
      this.loggedInUser.uid,
      false
    );
  };

  // end editing helpers

  // CONTROL HELPERS
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
