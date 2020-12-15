import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/storage';
import 'firebase/firestore';
import 'firebase/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireDatabase } from '@angular/fire/database';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  fs = firebase.firestore;
  db = firebase.database;
  storage = firebase.storage;

  constructor(
    private afs: AngularFirestore,
    private afd: AngularFireDatabase,
  ) {}

  /**
   * Inserts instructions for Firebase/Firestore to replace this with a server-side timestamp upon upload
   */
  fsServerTimestamp = this.fs.FieldValue.serverTimestamp;

  /**
   * Callable function to create a timestamp object representing the current moment
   */
  fsTimestampNow = this.fs.Timestamp.now;

  fsCreateId = this.afs.createId;

  /**
   * Quick access to vanilla Firebase storage reference (as opposed to AngularFire as used elsewhere)
   * @param path The path you'd like to store something at or access data from
   */
  createVanillaStorageRef = (path: string) => this.storage().ref(path);

  /**
   * Inserts instructions for Firebase/RTDB to replace this with a server-side timestamp upon upload
   */
  rtServerTimestamp = firebase.database.ServerValue.TIMESTAMP;

  rtCreateId = this.afd.createPushId;
}
