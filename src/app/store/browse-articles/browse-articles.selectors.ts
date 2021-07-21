import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  browseArticlesFeatureKey,
  BrowseArticleStateI,
} from './browse-articles.reducer';

export const browseState = createFeatureSelector<BrowseArticleStateI>(
  browseArticlesFeatureKey,
);

export const allPreviews = createSelector(
  browseState,
  state => state.allArticlePreviews,
);

export const latestPreviews = createSelector(
  browseState,
  state => state.latestArticlePreviews,
);
