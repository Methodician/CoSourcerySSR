import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ArticleService } from '@services/article.service';
import { of } from 'rxjs';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import {
  loadCurrentArticle,
  loadCurrentArticleFailure,
  loadCurrentArticleSuccess,
} from './article.actions';

@Injectable()
export class ArticleEffects {
  constructor(private actions$: Actions, private articleSvc: ArticleService) {}

  loadCurrentArticle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCurrentArticle),
      exhaustMap(({ articleId }) =>
        this.articleSvc
          .articleDetailRef(articleId)
          .valueChanges()
          .pipe(map(article => loadCurrentArticleSuccess({ article }))),
      ),
      catchError(error => of(loadCurrentArticleFailure({ error }))),
    ),
  );
}
