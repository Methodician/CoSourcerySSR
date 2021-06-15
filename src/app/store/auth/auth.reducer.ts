import { AuthInfoC } from '@models/auth-info';
import { Action, createReducer, on } from '@ngrx/store';
import { loadAuthFailure, loadAuthSuccess } from './auth.actions';

export const NULL_USER = new AuthInfoC(null, false, null, null);

export const authFeatureKey = 'auth';

export interface AuthStateI {
  authInfo: AuthInfoC;
  authError: any;
}

export const initialState: AuthStateI = {
  authInfo: NULL_USER,
  authError: null,
};

export const authReducer = createReducer(
  initialState,
  on(loadAuthSuccess, (_, action) => ({
    authInfo: action.authInfo,
    authError: null,
  })),
  on(loadAuthFailure, (state, action) => ({
    ...state,
    authError: action.error,
  })),
);
