import { createFeatureSelector, createSelector } from '@ngrx/store';
import { isEqual } from 'lodash';
import { articleFeatureKey, ArticleStateI } from './article.reducer';

export const articleState =
  createFeatureSelector<ArticleStateI>(articleFeatureKey);

export const currentArticle = createSelector(
  articleState,
  state => state.currentArticle,
);

export const currentArticleId = createSelector(
  articleState,
  state => state.currentArticleId,
);

export const currentArticleChanges = createSelector(
  articleState,
  ({ currentArticle, currentArticleId, coverImageFile, isArticleNew }) => ({
    currentArticle,
    currentArticleId,
    coverImageFile,
    isArticleNew,
  }),
);

export const currentArticleTags = createSelector(
  currentArticle,
  article => article.tags,
);

export const currentArticleTitle = createSelector(
  currentArticle,
  article => article.title,
);

export const currentArticleIntro = createSelector(
  currentArticle,
  article => article.introduction,
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
  currentArticle,
  article => article?.imageAlt,
);

export const isArticleChanged = createSelector(
  currentArticle,
  dbArticle,
  coverImageFile,
  (currentArticle, dbArticle, coverImageFile) =>
    !isEqual(currentArticle, dbArticle) || !!coverImageFile,
);
