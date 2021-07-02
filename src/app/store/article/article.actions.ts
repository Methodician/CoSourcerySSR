import { createAction, props } from '@ngrx/store';
import { ArticleDetailI } from '@shared_models/index';

export const resetArticleState = createAction(
  '[Article] Reset Current Article',
);

export const startNewArticle = createAction('[Article] Start New Article');

export const loadNotFoundArticle = createAction(
  '[Article] Load Not Found Article',
);

export const updateCurrentArticle = createAction(
  '[Article] Update Current Article',
  props<{ article: ArticleDetailI }>(),
);

export const addArticleTag = createAction(
  '[Article] Add Tag to Article',
  props<{ tag: string }>(),
);

export const removeArticleTag = createAction(
  '[Article] Remove Tag from Article',
  props<{ tag: string }>(),
);

export const loadCurrentArticle = createAction(
  '[Article] Load Current Article',
);

export const loadCurrentArticleSuccess = createAction(
  '[Article] Load Current Article Success',
  props<{ article: ArticleDetailI }>(),
);

export const loadCurrentArticleFailure = createAction(
  '[Article] Load Current Article Failure',
  props<{ error: any }>(),
);
