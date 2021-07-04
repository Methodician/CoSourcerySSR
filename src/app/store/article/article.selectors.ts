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
  currentArticleDetail,
  article => article.tags,
);

export const currentArticleTitle = createSelector(
  currentArticleDetail,
  article => article.title,
);

export const isArticleNew = createSelector(
  articleState,
  state => state.isArticleNew,
);

export const dbArticle = createSelector(articleState, state => state.dbArticle);

export const coverImageUri = createSelector(
  articleState,
  ({ coverImageUri }) => coverImageUri,
);

export const coverImageFile = createSelector(
  articleState,
  ({ coverImageFile }) => coverImageFile,
);

export const coverImageAlt = createSelector(
  currentArticleDetail,
  article => article?.imageAlt,
);

export const isArticleChanged = createSelector(
  currentArticleDetail,
  dbArticle,
  coverImageFile,
  (currentArticle, dbArticle, coverImageFile) =>
    !isEqual(currentArticle, dbArticle) || !!coverImageFile,
);
