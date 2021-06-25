import { createFeatureSelector, createSelector } from '@ngrx/store';
import { isEqual } from 'lodash';
import { articleFeatureKey, ArticleStateI } from './article.reducer';

export const articleState =
  createFeatureSelector<ArticleStateI>(articleFeatureKey);

export const currentArticleDetail = createSelector(
  articleState,
  state => state.currentArticle,
);

export const currentArticleId = createSelector(
  articleState,
  state => state.currentArticle.articleId,
);

export const currentArticleTags = createSelector(
  articleState,
  state => state.currentArticle.tags,
);

// !Is this state slice really needed?
export const isArticleNew = createSelector(
  articleState,
  state => state.isArticleNew,
);

export const dbArticle = createSelector(articleState, state => state.dbArticle);

export const isArticleChanged = createSelector(
  currentArticleDetail,
  dbArticle,
  (currentArticle, dbArticle) => isEqual(currentArticle, dbArticle),
);
