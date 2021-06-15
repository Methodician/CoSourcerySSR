import {
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer,
} from '@ngrx/store';
import { environment } from '../../environments/environment';
import { authFeatureKey, authReducer, AuthStateI } from './auth/auth.reducer';

export interface StateI {
  [authFeatureKey]: AuthStateI;
}

export const reducers: ActionReducerMap<StateI> = {
  [authFeatureKey]: authReducer,
};

export const metaReducers: MetaReducer<StateI>[] = !environment.production
  ? []
  : [];
