import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ArticleService } from '@services/article.service';
import { selectRouteParams } from '@store/router/router.selectors';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import {
  loadCurrentArticle,
  loadCurrentArticleFailure,
  loadCurrentArticleSuccess,
  loadNotFoundArticle,
} from './article.actions';

@Injectable()
export class ArticleEffects {
  constructor(
    private actions$: Actions,
    private articleSvc: ArticleService,
    private store: Store,
  ) {}

  loadCurrengArticle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCurrentArticle),
      switchMap(() => this.store.select(selectRouteParams).pipe(take(1))),
      switchMap(params => this.idFromSlug(params['id'])),
      switchMap(id =>
        !!id
          ? this.articleSvc
              .articleDetailRef(id)
              .valueChanges()
              .pipe(
                // !This is in case we want to stop storing articleId in the document itself
                map(article => ({ ...article, articleId: id })),
                map(article => loadCurrentArticleSuccess({ article })),
              )
          : of(loadNotFoundArticle()),
      ),
      catchError(error => of(loadCurrentArticleFailure({ error }))),
    ),
  );

  idFromSlug = (slug: string): Observable<string> =>
    this.articleSvc.slugIdRef(slug).valueChanges().pipe(take(1));
}
