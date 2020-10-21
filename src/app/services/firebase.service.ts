import { Injectable } from '@angular/core';
import * as firebase from 'firebase';
import 'firebase/storage';
import 'firebase/firestore';
import 'firebase/database';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  fs = firebase.firestore;
  db = firebase.database;
  storage = firebase.storage;

  /**
   * Inserts instructions for Firebase/Firestore to replace this with a server-side timestamp upon upload
   */
  fsServerTimestamp = this.fs.FieldValue.serverTimestamp;

  /**
   * Callable function to create a timestamp object representing the current moment
   */
  fsTimestampNow = this.fs.Timestamp.now;

  /**
   * Quick access to vanilla Firebase storage reference (as opposed to AngularFire as used elsewhere)
   * @param path The path you'd like to store something at or access data from
   */
  createVanillaStorageRef = (path: string) => this.storage().ref(path);

  /**
   * Inserts instructions for Firebase/RTDB to replace this with a server-side timestamp upon upload
   */
  rtServerTimestamp = firebase.database.ServerValue.TIMESTAMP;
}
