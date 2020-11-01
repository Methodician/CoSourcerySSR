import { Component, OnInit, OnDestroy } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { Subscription, BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap, map, startWith, switchMap, takeUntil } from 'rxjs/operators';

// SERVICES
import { ArticleService } from '@services/article.service';

import { UserService } from '@services/user.service';

// MODELS
import { ArticleDetailI } from '@shared_models/article.models';
import { CUserInfo } from '@models/user-info';
import { SeoService } from '@services/seo.service';
import { StorageService } from '@services/storage.service';

const VERSION_STATE_KEY = makeStateKey<BehaviorSubject<ArticleDetailI>>(
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
  private unsubscribe: Subject<void> = new Subject();
  loggedInUser = new CUserInfo({ fName: null, lName: null });

  // Article State
  articleId: string;
  articleSlug: string;
  versionId: string;
  articleSubscription: Subscription;

  articleVersionState: ArticleDetailI;

  constructor(
    private route: ActivatedRoute,
    private state: TransferState,
    private articleSvc: ArticleService,
    private userSvc: UserService,
    private seoSvc: SeoService,
    private storageSvc: StorageService,
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

  // FORM SETUP & BREAKDOWN
  initializeArticleIdAndState = () => {
    const article$ = this.watchArticleIdAndVersion$().pipe(
      tap(({ id, slug, version }) => {
        if (id) this.articleId = id;
        if (slug) this.articleSlug = slug;
        if (version) this.versionId = version;
      }),
      switchMap(
        ({ id, version }): Observable<ArticleDetailI> => {
          return this.watchArticleVersion$(id, version);
        },
      ),
    );
    article$.pipe(takeUntil(this.unsubscribe)).subscribe(article => {
      this.articleVersionState = article;
      if (article) {
        this.watchCoverImageUrl(article);
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
    const preExisting: ArticleDetailI = this.state.get(
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
              ) as ArticleDetailI)
            : null,
        ),
        tap(version => this.state.set(VERSION_STATE_KEY, version)),
        startWith(preExisting),
      );
    return version$;
  };

  watchCoverImageUrl = (article: ArticleDetailI) => {
    const { articleId, coverImageId } = article;
    if (coverImageId) {
      this.storageSvc
        .getImageUrl(`articleCoverImages/${articleId}/${coverImageId}`)
        .subscribe(url => (article.imageUrl = url));
    }
  };

  // ===end form setup & breakdown

  // ===OTHER

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
}
