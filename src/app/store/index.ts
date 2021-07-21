import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';
import {
  articleFeatureKey,
  articleReducer,
  ArticleStateI,
} from './article/article.reducer';
import { authFeatureKey, authReducer, AuthStateI } from './auth/auth.reducer';
import {
  browseArticlesFeatureKey,
  browseArticlesReducer,
  BrowseArticleStateI,
} from './browse-articles/browse-articles.reducer';

export interface StateI {
  [authFeatureKey]: AuthStateI;
  [articleFeatureKey]: ArticleStateI;
  [browseArticlesFeatureKey]: BrowseArticleStateI;
  router: RouterReducerState;
}

export const reducers: ActionReducerMap<StateI> = {
  [authFeatureKey]: authReducer,
  [articleFeatureKey]: articleReducer,
  [browseArticlesFeatureKey]: browseArticlesReducer,
  router: routerReducer,
};

export const metaReducers: MetaReducer<StateI>[] = !environment.production
  ? []
  : [];
