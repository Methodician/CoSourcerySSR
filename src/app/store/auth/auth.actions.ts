import { AuthInfoC } from '@models/auth-info';
import { createAction, props } from '@ngrx/store';

export const loadAuth = createAction('[Auth] Load Auths');

export const loadAuthSuccess = createAction(
  '[Auth] Load Auths Success',
  props<{ authInfo: AuthInfoC }>(),
);

export const loadAuthFailure = createAction(
  '[Auth] Load Auths Failure',
  props<{ error: any }>(),
);
