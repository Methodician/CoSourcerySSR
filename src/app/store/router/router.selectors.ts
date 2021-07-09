import { createFeatureSelector } from '@ngrx/store';

import { getSelectors, RouterReducerState } from '@ngrx/router-store';

export const selectRouter = createFeatureSelector<RouterReducerState>('router');

export const {
  selectCurrentRoute,
  selectFragment,
  selectQueryParam,
  selectQueryParams,
  selectRouteParam,
  selectRouteParams,
  selectRouteData,
  selectUrl,
} = getSelectors(selectRouter);
