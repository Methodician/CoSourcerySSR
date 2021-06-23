import { createFeatureSelector, createSelector } from '@ngrx/store';
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
