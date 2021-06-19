import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectRouteParams } from '@store/router/router.selectors';
import { articleFeatureKey, ArticleStateI } from './article.reducer';

export const articleState =
  createFeatureSelector<ArticleStateI>(articleFeatureKey);

export const selectArticle = createSelector(
  articleState,
  selectRouteParams,
  (articleState, routeParams) => ({ articleState, routeParams }),
);
