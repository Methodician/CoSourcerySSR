import { Injectable } from '@angular/core';
import { UserInfo } from '@models/classes/user-info';
import { AngularFireDatabase } from '@angular/fire/database';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { AngularFireStorage } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private NULL_USER = new UserInfo({ fName: null, lName: null });
  loggedInUser$: BehaviorSubject<UserInfo> = new BehaviorSubject(
    this.NULL_USER
  );

  constructor(
    private afd: AngularFireDatabase,
    private authSvc: AuthService,
    private storage: AngularFireStorage
  ) {
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

  // REFS
  userRef = uid => this.afd.object<UserInfo>(`userInfo/open/${uid}`);
  // end refs

  // WATCHERS
  // end watchers

  // UTILITY
  updateUser = (user: UserInfo) => {
    return this.userRef(user.uid).update(user);
  };

  uploadProfileImage = (uid: string, image: File) => {
    // TODO: set up thumbnail production system for this too...
    try {
      const storageRef = this.storage.ref(`profileImages/${uid}`);
      const task = storageRef.put(image);
      return { task, ref: storageRef };
    } catch (error) {
      console.error(error);
    }
  };
  // end utility
}
