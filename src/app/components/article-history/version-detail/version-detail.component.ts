import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireUploadTask } from '@angular/fire/storage';
import { ActivatedRoute, Router } from '@angular/router';

import { Subscription, BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap, map, startWith, switchMap, takeUntil } from 'rxjs/operators';

// SERVICES
import { ArticleService } from '@services/article.service';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { UserService } from '@services/user.service';

// MODELS
import { IVersionDetail } from '@models/article-info';
import { CUserInfo } from '@models/user-info';
import { SeoService } from '@services/seo.service';
import { ECtrlNames } from '../../article/article.component';

const VERSION_STATE_KEY = makeStateKey<BehaviorSubject<IVersionDetail>>(
  'articleVersionState',
);

@Component({
  selector: 'cos-version-detail',
  templateUrl: './version-detail.component.html',
  styleUrls: [
    './version-detail.component.scss',
    '../../article/article.component.scss',
  ],
})
export class VersionDetailComponent implements OnInit, OnDestroy {
  @ViewChild('formBoundingBox', { static: false }) formBoundingBox;

  private unsubscribe: Subject<void> = new Subject();
  loggedInUser = new CUserInfo({ fName: null, lName: null });

  //  // Cover Image State
  coverImageFile: File;
  coverImageUploadTask: AngularFireUploadTask;

  // Article State
  articleId: string;
  articleSlug: string;
  versionId: string;
  isArticleNew: boolean;
  articleSubscription: Subscription;
  currentArticleEditors = {};

  // Article Form State
  editSessionTimeoutSubscription: Subscription;

  articleEditForm: FormGroup = this.fb.group({
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
    tags: [[], Validators.maxLength(25)],
    isFeatured: false,
    editors: {},
  });

  articleVersionState: IVersionDetail;

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
  ) {
    this.userSvc.loggedInUser$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(user => {
        this.loggedInUser = user;
      });
  }

  ngOnInit() {
    this.initializeArticleIdAndState();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.state.set(VERSION_STATE_KEY, null);
  }

  cancelUpload = (task: AngularFireUploadTask) => {
    if (task) task.cancel();
  };

  // FORM SETUP & BREAKDOWN
  initializeArticleIdAndState = () => {
    const article$ = this.watchArticleIdAndVersion$().pipe(
      tap(({ id, slug, version }) => {
        if (id) this.articleId = id;
        if (slug) this.articleSlug = slug;
        if (version) this.versionId = version;
      }),
      switchMap(
        ({ id, version }): Observable<IVersionDetail> => {
          return this.watchArticleVersion$(id, version);
        },
      ),
    );
    article$.pipe(takeUntil(this.unsubscribe)).subscribe(article => {
      this.articleVersionState = article;
      if (article) {
        this.articleEditForm.patchValue(article);
        this.updateMetaTags(article);
      }
    });
  };

  watchArticleIdAndVersion$ = () =>
    this.route.params.pipe(
      switchMap(params =>
        this.articleSvc.getIdFromSlugOrId(params['id']).pipe(
          map(id => ({
            id,
            slug: params['id'],
            version: params['versionId'],
          })),
        ),
      ),
    );

  watchArticleVersion$ = (id, versionId) => {
    const preExisting: IVersionDetail = this.state.get(
      VERSION_STATE_KEY,
      null as any,
    );
    const version$ = this.articleSvc
      .versionDetailRef(id, versionId)
      .valueChanges()
      .pipe(
        map(version =>
          version
            ? (this.articleSvc.processArticleTimestamps(
                version,
              ) as IVersionDetail)
            : null,
        ),
        tap(version => this.state.set(VERSION_STATE_KEY, version)),
        startWith(preExisting),
      );
    return version$;
  };
  // ===end form setup & breakdown

  // ===OTHER

  updateMetaTags = (article: IVersionDetail) => {
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
}
