import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ArticleService } from '@services/article.service';
import { selectRouteParams } from '@store/router/router.selectors';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  loadCurrentArticle,
  loadCurrentArticleFailure,
  loadCurrentArticleSuccess,
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
      switchMap(() => this.store.select(selectRouteParams)),
      switchMap(params => this.articleSvc.getIdFromSlugOrId(params['id'])),
      switchMap(id => this.articleSvc.articleDetailRef(id).valueChanges()),
      map(article => loadCurrentArticleSuccess({ article })),
      catchError(error => of(loadCurrentArticleFailure({ error }))),
    ),
  );
}
