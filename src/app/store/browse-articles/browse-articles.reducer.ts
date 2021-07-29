import { createReducer, on } from '@ngrx/store';
import { ArticlePreviewI } from '@shared_models/index';
import {
  loadAllArticlePreviewsSuccess,
  loadBookmarkedArticlePreviewsSuccess,
  loadLatestArticlePreviewsSuccess,
} from './browse-articles.actions';

export const browseArticlesFeatureKey = 'browseArticles';

export interface BrowseArticleStateI {
  allArticlePreviews: ReadonlyArray<ArticlePreviewI>;
  latestArticlePreviews: ReadonlyArray<ArticlePreviewI>;
  bookmarkedArticlePreviews: ReadonlyArray<ArticlePreviewI>;
}

export const initialState: BrowseArticleStateI = {
  allArticlePreviews: [],
  latestArticlePreviews: [],
  bookmarkedArticlePreviews: [],
};

export const browseArticlesReducer = createReducer(
  initialState,
  on(loadAllArticlePreviewsSuccess, (state, { allArticlePreviews }) => ({
    ...state,
    allArticlePreviews,
  })),
  on(loadLatestArticlePreviewsSuccess, (state, { latestArticlePreviews }) => ({
    ...state,
    latestArticlePreviews,
  })),
  on(
    loadBookmarkedArticlePreviewsSuccess,
    (state, { bookmarkedArticlePreviews }) => ({
      ...state,
      bookmarkedArticlePreviews,
    }),
  ),
);
