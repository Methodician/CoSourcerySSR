import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ArticleService } from '@services/article.service';
import { exhaustMap, map } from 'rxjs/operators';
import {
  loadAllArticlePreviews,
  loadAllArticlePreviewsSuccess,
} from './browse-articles.actions';

@Injectable()
export class BrowseArticlesEffects {
  constructor(private articleSvc: ArticleService, private actions$: Actions) {}

  loadAllArticlePreviews$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAllArticlePreviews),
      exhaustMap(() =>
        this.articleSvc.allArticlesRef().valueChanges({ idField: 'articleId' }),
      ),
      map(articlePreviews =>
        loadAllArticlePreviewsSuccess({ articlePreviews }),
      ),
    ),
  );
}
