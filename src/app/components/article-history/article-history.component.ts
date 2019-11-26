import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  TransferState,
  makeStateKey,
  StateKey,
} from '@angular/platform-browser';

import { IArticleDetail, IArticlePreview } from '@models/article-info';

import { ArticleService } from '@services/article.service';

import { Observable, Subject } from 'rxjs';
import { map, tap, startWith } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

const ALL_ARTICLES_KEY = makeStateKey<Observable<IArticlePreview[]>>(
  'allArticles'
);
const ALL_ARTICLE_EDITS_KEY = makeStateKey<Observable<IArticlePreview[]>>(
  'allArticleEdits'
);

@Component({
  selector: 'cos-article-history',
  templateUrl: './article-history.component.html',
  styleUrls: ['./article-history.component.scss'],
})
export class ArticleHistoryComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject();
  articleId: string;
  articles$: Observable<IArticleDetail[]>;
  allArticleEdits$: Observable<IArticleDetail[]>;

  constructor(
    private articleSvc: ArticleService,
    private state: TransferState,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.articleId = params['id'];
    });
    this.initializeArticles();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.clearArticleKeys();
  }

  // ARTICLE STUFF
  initializeArticles = () => {
    this.articles$ = this.articleSvc.allArticleEditsRef(this.articleId).valueChanges()
    this.allArticleEdits$ = this.ssrArticleCollection(
      this.articles$,
      ALL_ARTICLE_EDITS_KEY,
    );
  };

  clearArticleKeys = () => {
    this.state.set(ALL_ARTICLES_KEY, null);
    this.state.set(ALL_ARTICLE_EDITS_KEY, null);
  };

  ssrArticleCollection = (
    articles$: Observable<IArticleDetail[]>,
    stateKey: StateKey<Observable<IArticleDetail[]>>,
  ) => {
    const preExisting$ = this.state.get(stateKey, null as any);
    return articles$.pipe(
      map(articles =>
        articles.map(article => this.articleSvc.processArticleTimestamps(article))
      ),
      tap(articles => this.state.set(stateKey, articles)),
      startWith(preExisting$)
    );
  };

  //end article stuff
}
