import { AuthInfoI } from '@models/auth-info';
import { createAction, props } from '@ngrx/store';

export const loadAuth = createAction('[Auth] Load Auths');

export const loadAuthSuccess = createAction(
  '[Auth] Load Auths Success',
  props<{ authInfo: AuthInfoI }>(),
);

export const loadAuthFailure = createAction(
  '[Auth] Load Auths Failure',
  props<{ error: any }>(),
);

export const promptIfNotLoggedIn = createAction(
  '[Auth] Prompt if not logged in',
);

export const authConfirmed = createAction('[Auth] Auth Confirmed');

export const authRefuted = createAction('[Auth] Auth Refuted');
