import { createAction, props } from '@ngrx/store';
import { ArticleDetailI } from '@shared_models/index';

export const loadCurrentArticle = createAction(
  '[Article] Load Current Article',
);

export const resetArticleState = createAction(
  '[Article] Reset Current Article',
);

export const loadNotFoundArticle = createAction(
  '[Article] Load Not Found Article',
);

export const loadCurrentArticleSuccess = createAction(
  '[Article] Load Current Article Success',
  props<{ article: ArticleDetailI }>(),
);

export const loadCurrentArticleFailure = createAction(
  '[Article] Load Current Article Failure',
  props<{ error: any }>(),
);

export const updateCurrentArticle = createAction(
  '[Article] Update Current Article',
  props<{ article: ArticleDetailI }>(),
);
