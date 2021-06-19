import { createFeatureSelector, createSelector } from '@ngrx/store';
import { articleFeatureKey, ArticleStateI } from './article.reducer';

export const articleState =
  createFeatureSelector<ArticleStateI>(articleFeatureKey);
