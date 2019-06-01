import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticleService } from '@services/article.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ArticleDetail } from '@models/interfaces/article-info';
import { UserInfo } from '@models/classes/user-info';
import { UserService } from '@services/user.service';

@Component({
  selector: 'cos-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent implements OnInit {
  loggedInUser = new UserInfo(null, null, null, null);

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
  // articleState: ArticleDetail = this.articleEditForm.value;

  CtrlNames = CtrlNames; // Enum Availablility in HTML Template
  ctrlBeingEdited: CtrlNames = CtrlNames.none;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private articleSvc: ArticleService,
    private userSvc: UserService
  ) {
    this.userSvc.loggedInUser$.subscribe(user => {
      this.loggedInUser = user;
    });
  }

  ngOnInit() {}

  // Form Setup & Breakdown
  // initializeArticleState = () => {
  //   this.articleState = this.articleEditForm.value;
  // };

  // setArticleId = () => {
  //   this.route.params.subscribe(params => {
  //     if (params['key']) {
  //       this.articleId = params['key'];
  //       this.articleIsNew = false;
  //     } else {
  //       this.articleId = this.articleSvc.createArticleId();
  //       this.articleIsNew = true;
  //       this.formIsInCreateView = true;
  //     }
  //     this.ckeditor.config.fbImageStorage = {
  //       storageRef: this.articleSvc.createVanillaStorageRef(
  //         `articleBodyImages/${this.articleId}/`,
  //       ),
  //     };
  //   });
  // }

  // watchArticle() {
  //   this.articleSubscription = this.articleSvc
  //     .getArticleRefById(this.articleId)
  //     .valueChanges()
  //     .subscribe(articleData => {
  //       this.updateMetaData(articleData);
  //       this.ckeditor.content = articleData
  //         ? articleData.body
  //         : this.ckeditor.placeholder;
  //       this.setFormData(articleData);
  //     });
  // }

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
