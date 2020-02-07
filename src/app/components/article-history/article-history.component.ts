import { Component, OnInit } from '@angular/core';
import {
  TransferState,
  makeStateKey,
  StateKey,
} from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap, startWith, switchMap } from 'rxjs/operators';

import { IArticlePreview } from '@models/article-info';
import { ArticleService } from '@services/article.service';

const ALL_ARTICLE_VERSIONS_KEY = makeStateKey<Observable<IArticlePreview[]>>(
  'allArticleVersions'
);

@Component({
  selector: 'cos-article-history',
  templateUrl: './article-history.component.html',
  styleUrls: [
    './article-history.component.scss',
    '../home/home.component.scss',
  ]
})
export class ArticleHistoryComponent implements OnInit {

  articleId: string;
  allArticleVersions$: Observable<IArticlePreview[]>;
  articleVersions$: Observable<IArticlePreview[]>;

  constructor(
    private articleSvc: ArticleService,
    private state: TransferState,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.route.params.pipe(switchMap(params => this.articleSvc.getIdFromSlugOrId(params['id']))).subscribe(id => {
      this.articleId = id;
      this.initializeArticles();
    });
  }

  initializeArticles = () => {
    this.articleVersions$ = this.articleSvc.allArticleVersionsRef(this.articleId).valueChanges()
    this.allArticleVersions$ = this.ssrArticleCollection(
      this.articleVersions$,
      ALL_ARTICLE_VERSIONS_KEY
    );
  };

  ssrArticleCollection = (
    articles$: Observable<IArticlePreview[]>,
    stateKey: StateKey<Observable<IArticlePreview[]>>
  ) => {
    const preExisting$ = this.state.get(stateKey, null as any);
    return articles$.pipe(
      map(articles =>
        articles.map(art => this.articleSvc.processArticleTimestamps(art))
      ),
      tap(articles => this.state.set(stateKey, articles)),
      startWith(preExisting$)
    );
  };

}
