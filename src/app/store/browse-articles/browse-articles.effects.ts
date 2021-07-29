import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ArticleService } from '@services/article.service';
import { ArticlePreviewI } from '@shared_models/index';
import { authUid } from '@store/auth/auth.selectors';
import { exhaustMap, map, switchMap } from 'rxjs/operators';
import {
  loadAllArticlePreviews,
  loadAllArticlePreviewsSuccess,
  loadBookmarkedArticlePreviews,
  loadBookmarkedArticlePreviewsSuccess,
  loadLatestArticlePreviews,
  loadLatestArticlePreviewsSuccess,
} from './browse-articles.actions';

@Injectable()
export class BrowseArticlesEffects {
  constructor(
    private articleSvc: ArticleService,
    private actions$: Actions,
    private store: Store,
  ) {}

  loadAllArticlePreviews$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAllArticlePreviews),
      exhaustMap(() =>
        this.articleSvc.allArticlesRef().valueChanges({ idField: 'articleId' }),
      ),
      map(rawPreviews =>
        rawPreviews.map(preview => this.processPreviewTimestamps(preview)),
      ),
      map(allArticlePreviews =>
        loadAllArticlePreviewsSuccess({ allArticlePreviews }),
      ),
    ),
  );

  loadLatestPreviews$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadLatestArticlePreviews),
      exhaustMap(() =>
        this.articleSvc
          .latestArticlesRef()
          .valueChanges({ idField: 'articleId' }),
      ),
      map(rawPreviews =>
        rawPreviews.map(preview => this.processPreviewTimestamps(preview)),
      ),
      map(latestArticlePreviews =>
        loadLatestArticlePreviewsSuccess({ latestArticlePreviews }),
      ),
    ),
  );

  loadBookmarkedPreviews$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadBookmarkedArticlePreviews),
      exhaustMap(() => this.store.select(authUid)),
      switchMap(uid => this.articleSvc.watchBookmarkedArticles(uid)),
      map(rawPreviews =>
        rawPreviews.map(preview => this.processPreviewTimestamps(preview)),
      ),
      map(bookmarkedArticlePreviews =>
        loadBookmarkedArticlePreviewsSuccess({ bookmarkedArticlePreviews }),
      ),
    ),
  );

  processPreviewTimestamps = (article: ArticlePreviewI) => {
    const { timestamp, lastUpdated } = article;
    if (timestamp) article.timestamp = timestamp.toDate();
    if (lastUpdated) article.lastUpdated = lastUpdated.toDate();
    return article;
  };
}
