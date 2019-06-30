import { Injectable } from '@angular/core';
import { UserInfo } from '@models/classes/user-info';
import { AngularFireDatabase } from '@angular/fire/database';
import { BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private NULL_USER = new UserInfo({ fName: null, lName: null });
  loggedInUser$: BehaviorSubject<UserInfo> = new BehaviorSubject(
    this.NULL_USER
  );

  constructor(private afd: AngularFireDatabase, private authSvc: AuthService) {
    this.authSvc.authInfo$.subscribe(authInfo => {
      if (!authInfo.isLoggedIn()) {
        this.loggedInUser$.next(this.NULL_USER);
      } else {
        this.userRef(authInfo.uid)
          .valueChanges()
          .subscribe((val: UserInfo) => {
            this.loggedInUser$.next(val);
          });
      }
    });
  }

  // refs
  userRef = uid => this.afd.object<UserInfo>(`userInfo/open/${uid}`);

  // watchers
}
