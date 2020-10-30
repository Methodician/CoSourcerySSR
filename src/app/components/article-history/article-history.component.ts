import { Component, OnInit } from '@angular/core';
import {
  TransferState,
  makeStateKey,
  StateKey,
} from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap, startWith, switchMap } from 'rxjs/operators';

import { ArticleDetailI } from '@shared_models/article.models';
import { ArticleService } from '@services/article.service';

const ALL_ARTICLE_VERSIONS_KEY = makeStateKey<Observable<ArticleDetailI[]>>(
  'allArticleVersions',
);

@Component({
  selector: 'cos-article-history',
  templateUrl: './article-history.component.html',
  styleUrls: [
    './article-history.component.scss',
    '../home/home.component.scss',
  ],
})
export class ArticleHistoryComponent implements OnInit {
  allArticleVersions$: Observable<ArticleDetailI[]>;

  constructor(
    private articleSvc: ArticleService,
    private state: TransferState,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        switchMap(params => this.articleSvc.getIdFromSlugOrId(params['id'])),
      )
      .subscribe(id => this.initializeArticles(id));
  }

  initializeArticles = (articleId: string) =>
    (this.allArticleVersions$ = this.ssrArticleVersionCollection(
      this.articleSvc.allArticleVersionsRef(articleId).valueChanges(),
      ALL_ARTICLE_VERSIONS_KEY,
    ));

  clearArticleKeys = () => this.state.set(ALL_ARTICLE_VERSIONS_KEY, null);

  ssrArticleVersionCollection = (
    versions$: Observable<ArticleDetailI[]>,
    stateKey: StateKey<Observable<ArticleDetailI[]>>,
  ) => {
    const preExisting$ = this.state.get(stateKey, null as any);
    return versions$.pipe(
      map(versions =>
        versions.map(version =>
          this.articleSvc.processArticleTimestamps(version),
        ),
      ),
      tap(versions => this.state.set(stateKey, versions)),
      startWith(preExisting$),
    );
  };

  // HELPERS
  createPreviewLink = (article: ArticleDetailI) =>
    `/article/${article.articleId}/history/${article.version}`;
  // end helpers
}
