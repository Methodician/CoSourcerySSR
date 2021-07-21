import { createAction, props } from '@ngrx/store';
import { ArticlePreviewI } from '@shared_models/index';

export const loadAllArticlePreviews = createAction(
  '[BrowseArticles] Load article previews',
);

export const loadAllArticlePreviewsSuccess = createAction(
  '[BrowseArticles] Load article previews Success',
  props<{ articlePreviews: ReadonlyArray<ArticlePreviewI> }>(),
);

export const loadAllArticlePreviewsFailure = createAction(
  '[BrowseArticles] Load article previews Failure',
  props<{ error: any }>(),
);
