import { AuthInfoI } from '@models/auth-info';
import { Action, createReducer, on } from '@ngrx/store';
import { loadAuthFailure, loadAuthSuccess } from './auth.actions';

export const NULL_USER: AuthInfoI = {
  uid: null,
  emailVerified: false,
  displayName: null,
  email: null,
};

export const authFeatureKey = 'auth';

export interface AuthStateI {
  authInfo: AuthInfoI;
  authError: any;
  hasAuthLoaded: boolean;
}

export const initialState: AuthStateI = {
  authInfo: NULL_USER,
  authError: null,
  hasAuthLoaded: false,
};

export const authReducer = createReducer(
  initialState,
  on(loadAuthSuccess, (_, action) => ({
    authInfo: action.authInfo,
    authError: null,
    hasAuthLoaded: true,
  })),
  on(loadAuthFailure, (state, action) => ({
    ...state,
    authError: action.error,
  })),
);
