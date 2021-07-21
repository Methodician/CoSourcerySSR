import { createReducer, on } from '@ngrx/store';
import { ArticlePreviewI } from '@shared_models/index';
import {
  loadAllArticlePreviewsSuccess,
  loadLatestArticlePreviewsSuccess,
} from './browse-articles.actions';

export const browseArticlesFeatureKey = 'browseArticles';

export interface BrowseArticleStateI {
  allArticlePreviews: ReadonlyArray<ArticlePreviewI>;
  latestArticlePreviews: ReadonlyArray<ArticlePreviewI>;
}

export const initialState: BrowseArticleStateI = {
  allArticlePreviews: [],
  latestArticlePreviews: [],
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
);
