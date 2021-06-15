import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AuthInfoC } from '@models/auth-info';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import { loadAuth, loadAuthFailure, loadAuthSuccess } from './auth.actions';
import { NULL_USER } from './auth.reducer';

@Injectable()
export class AuthEffects {
  constructor(private actions$: Actions, private afAuth: AngularFireAuth) {}

  loadAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAuth),
      exhaustMap(_ => this.afAuth.user),
      map(user =>
        user
          ? loadAuthSuccess({
              authInfo: new AuthInfoC(
                user.uid,
                user.emailVerified,
                user.displayName,
                user.email,
              ),
            })
          : loadAuthSuccess({ authInfo: NULL_USER }),
      ),
      catchError(error => of(loadAuthFailure({ error }))),
    ),
  );
}
