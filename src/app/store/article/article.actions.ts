import { createAction, props } from '@ngrx/store';
import { ArticleDetailI } from '@shared_models/index';

export const loadCurrentArticle = createAction(
  '[Article] Load Current Article',
  props<{ articleId: string }>(),
);

export const loadCurrentArticleSuccess = createAction(
  '[Article] Load Current Article Success',
  props<{ article: ArticleDetailI }>(),
);

export const loadCurrentArticleFailure = createAction(
  '[Article] Load Current Article Failure',
  props<{ error: any }>(),
);
