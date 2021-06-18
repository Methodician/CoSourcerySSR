import { createAction, props } from '@ngrx/store';
import { ArticleDetailI } from '@shared_models/index';

export const loadCurrentArticle = createAction(
  '[Article] Load Articles',
  props<{ articleId: string }>(),
);

export const loadCurrentArticleSuccess = createAction(
  '[Article] Load Articles Success',
  props<{ article: ArticleDetailI }>(),
);

export const loadCurrentArticleFailure = createAction(
  '[Article] Load Articles Failure',
  props<{ error: any }>(),
);
