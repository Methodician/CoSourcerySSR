import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { DialogService } from '@services/dialog.service';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, take } from 'rxjs/operators';
import {
  authConfirmed,
  authRefuted,
  loadAuth,
  loadAuthFailure,
  loadAuthSuccess,
  promptIfNotLoggedIn,
} from './auth.actions';
import { NULL_USER } from './auth.reducer';
import { isLoggedIn } from './auth.selectors';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private store: Store,
    private afAuth: AngularFireAuth,
    private dialogSvc: DialogService,
  ) {}

  loadAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAuth),
      exhaustMap(_ => this.afAuth.user),
      map(user =>
        user
          ? loadAuthSuccess({
              authInfo: {
                uid: user.uid,
                emailVerified: user.emailVerified,
                displayName: user.displayName,
                email: user.email,
              },
            })
          : loadAuthSuccess({ authInfo: NULL_USER }),
      ),
      catchError(error => of(loadAuthFailure({ error }))),
    ),
  );

  promptIfNotLoggedIn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(promptIfNotLoggedIn),
      exhaustMap(_ => this.store.select(isLoggedIn)),
      take(1),
      switchMap(isLoggedIn =>
        isLoggedIn
          ? of(authConfirmed())
          : this.dialogSvc
              .openLoginDialog()
              .afterClosed()
              .pipe(map(_ => authRefuted())),
      ),
    ),
  );
}
