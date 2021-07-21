import { createReducer, on } from '@ngrx/store';
import { ArticlePreviewI } from '@shared_models/index';
import { loadAllArticlePreviewsSuccess } from './browse-articles.actions';

export const browseArticlesFeatureKey = 'browseArticles';

export interface BrowseArticleStateI {
  articlePreviews: ReadonlyArray<ArticlePreviewI>;
}

export const initialState: BrowseArticleStateI = {
  articlePreviews: [],
};

export const browseArticlesReducer = createReducer(
  initialState,
  on(loadAllArticlePreviewsSuccess, (_, { articlePreviews }) => ({
    articlePreviews,
  })),
);
