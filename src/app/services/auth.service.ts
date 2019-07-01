import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { take, map, tap } from 'rxjs/operators';
import { AuthInfo } from '@models/classes/auth-info';
import { MatDialog } from '@angular/material/dialog';
// import { AngularFireDatabase } from '@angular/fire/database';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  NULL_USER = new AuthInfo(null, false, null, null);

  authInfo$ = new BehaviorSubject<AuthInfo>(this.NULL_USER);

  constructor(
    private dialogue: MatDialog,
    private afAuth: AngularFireAuth // private rtdb: AngularFireDatabase,
  ) {
    this.afAuth.user.subscribe(user => {
      if (user) {
        this.authInfo$.next(
          new AuthInfo(
            user.uid,
            user.emailVerified,
            user.displayName,
            user.email
          )
        );
      } else {
        this.authInfo$.next(this.NULL_USER);
      }
    });
  }

  // articlesBeingEditedByUserRef() {
  //   const uid = this.authInfo$.value.uid;
  //   return this.rtdb.list(`articleData/editStatus/articlesByEditor/${uid}`);
  // }

  login(email: string, password: string) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password);
  }

  // async cleanupEditorTrackingInfo() {
  //   const uid = this.authInfo$.value.uid;
  //   const updates = {};
  //   const snapshot = await this.rtdb
  //     .list(`articleData/editStatus/articlesByEditor/${uid}`)
  //     .query.once('value');
  //   const val = snapshot.val();
  //   if (!val) return;
  //   const articleIds = Object.keys(val);
  //   for (let id of articleIds) {
  //     updates[`articleData/editStatus/editorsByArticle/${id}/${uid}`] = null;
  //     updates[`articleData/editStatus/articlesByEditor/${uid}/${id}`] = null;
  //   }
  //   return this.rtdb.database.ref().update(updates);
  // }

  async logout() {
    // await this.cleanupEditorTrackingInfo();
    return this.afAuth.auth.signOut();
  }

  register(email: string, password: string) {
    return this.afAuth.auth.createUserWithEmailAndPassword(email, password);
  }

  /**
   * Checks auth state once
   */
  isSignedIn = () => {
    return this.afAuth.authState.pipe(
      take(1),
      map(res => {
        return !!res;
      })
    );
  };

  /**
   * Checks authstate once, returns isSignedIn,
   * and prompts user to sign in if they haven't
   */
  isSignedInOrPrompt = () => {
    return this.isSignedIn().pipe(
      tap(async isSignedIn => {
        if (!isSignedIn) {
          const { LoginDialogComponent } = await import(
            '@modals/login-dialog/login-dialog.component'
          );
          this.dialogue.open(LoginDialogComponent);
        }
      })
    );
  };

  async sendVerificationEmail() {
    const user = this.afAuth.auth.currentUser;
    try {
      return await user.sendEmailVerification();
    } catch (err) {
      alert(
        'It looks like your verification email was not sent. Please try again or contact support.' +
          err
      );
    }
  }
}
