import { createAction, props } from '@ngrx/store';
import { ArticlePreviewI } from '@shared_models/index';

export const loadAllArticlePreviews = createAction(
  '[BrowseArticles] Load article previews',
);

export const loadAllArticlePreviewsSuccess = createAction(
  '[BrowseArticles] Load all article previews Success',
  props<{ allArticlePreviews: ReadonlyArray<ArticlePreviewI> }>(),
);

export const loadAllArticlePreviewsFailure = createAction(
  '[BrowseArticles] Load all article previews Failure',
  props<{ error: any }>(),
);

export const loadLatestArticlePreviews = createAction(
  '[BrowseArticles] Load latest article previews',
);

export const loadLatestArticlePreviewsSuccess = createAction(
  '[BrowseArticles] Load latest article previews Success',
  props<{ latestArticlePreviews: ReadonlyArray<ArticlePreviewI> }>(),
);

export const loadLatestArticlePreviewsFailure = createAction(
  '[BrowseArticles] Load latest article previews Failure',
  props<{ error: any }>(),
);

export const loadBookmarkedArticlePreviews = createAction(
  '[BrowseArticles] Load bookmarked article previews',
);

export const loadBookmarkedArticlePreviewsSuccess = createAction(
  '[BrowseArticles] Load bookmarked article previews Success',
  props<{ bookmarkedArticlePreviews: ReadonlyArray<ArticlePreviewI> }>(),
);

export const loadBookmarkedArticlePreviewsFailure = createAction(
  '[BrowseArticles] Load bookmarked article previews Failure',
  props<{ error: any }>(),
);
