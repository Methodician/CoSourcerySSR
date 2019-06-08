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

import { Subscription, BehaviorSubject } from 'rxjs';
import { tap, map, startWith } from 'rxjs/operators';

const ARTICLE_STATE_KEY = makeStateKey<BehaviorSubject<ArticleDetail>>(
  'articleState'
);

@Component({
  selector: 'cos-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent implements OnInit, OnDestroy {
  loggedInUser = new UserInfo(null, null, null, null);

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
  // currentArticleEditors = {};

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

  CtrlNames = CtrlNames; // Enum Availablility in HTML Template
  ctrlBeingEdited: CtrlNames = CtrlNames.none;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private state: TransferState,
    private articleSvc: ArticleService,
    private userSvc: UserService
  ) {
    this.userSvc.loggedInUser$.subscribe(user => {
      this.loggedInUser = user;
    });
  }

  ngOnInit() {
    this.initializeArticleIdAndState();
  }

  ngOnDestroy() {
    this.articleSubscription.unsubscribe();
    this.state.set(ARTICLE_STATE_KEY, null);
  }

  // Form Setup & Breakdown
  initializeArticleIdAndState = () => {
    this.watchArticleId$().subscribe(id => {
      if (id) this.initializeArticleState(id);
    });
  };

  initializeArticleState = (id: string) => {
    if (this.isArticleNew) this.articleState = this.articleEditForm.value;
    else {
      this.articleSubscription = this.watchArticle(id).subscribe(article => {
        if (article) {
          this.articleState = article;
        }
      });
    }
  };

  watchArticleId$ = () => {
    const id$ = new BehaviorSubject<string>(null);
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isArticleNew = false;
        id$.next(params['id']);
      } else {
        this.isArticleNew = true;
        this.isFormInCreateView = true;
        id$.next(this.articleSvc.createArticleId());
      }
      // this.ckeditor.config.fbImageStorage = {
      //   storageRef: this.articleSvc.createVanillaStorageRef(
      //     `articleBodyImages/${this.articleId}/`
      //   ),
      // };
    });
    return id$;
  };

  watchArticle = id => {
    const preExisting = this.state.get(ARTICLE_STATE_KEY, null as any);
    return this.articleSvc
      .articleDetailRef(id)
      .valueChanges()
      .pipe(
        map(article =>
          article ? this.articleSvc.processArticleTimestamps(article) : null
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
    // return article$;
  };

  // watchFormChanges() {
  //   this.articleEditFormSubscription = this.articleEditForm.valueChanges.subscribe(
  //     change => {
  //       this.articleState = change;
  //       if (this.articleEditForm.dirty) {
  //         this.setEditSessionTimeout();
  //         if (!this.userIsEditingArticle()) {
  //           this.addUserEditingStatus();
  //         }
  //       }
  //     },
  //   );
  // }

  // UI Display
  activateCtrl = async (ctrl: CtrlNames) => {
    // if (ctrl === CtrlNames.none) {
    //   this.ctrlBeingEdited = ctrl;
    //   return;
    // }
    // // For now doesn't allow multiple editors. Will change later...
    // if (!this.userIsEditingArticle() && this.articleHasEditors()) {
    //   // Editors is an array so that we can later allow multilple collaborative editors.
    //   // For now we'll just check the first (only) element in the array
    //   const uid = Object.keys(this.currentArticleEditors)[0];
    //   if (!this.userMap[uid]) {
    //     await this.userSvc.addUserToMap(uid);
    //   }
    //   this.openMessageDialog(
    //     'Edit Locked',
    //     `The user "${this.userMap[
    //       uid
    //     ].displayName()}" is currently editing this article.`,
    //     'Please try again later.',
    //   );
    // } else if (this.authCheck()) {
    //   this.ctrlBeingEdited = ctrl;
    // }
  };

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
