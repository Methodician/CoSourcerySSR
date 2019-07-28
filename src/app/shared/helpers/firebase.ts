import firebase from '@firebase/app';
import '@firebase/storage';
import '@firebase/firestore';
import '@firebase/database';

/**
 * Quick access to vanilla Firebase storage reference (as opposed to AngularFire as used elsewhere)
 * @param path The path you'd like to store something at or access data from
 */
const createVanillaStorageRef = (path: string) => {
  return firebase.storage().ref(path);
};

/**
 * Inserts instructions for Firebase/Firestore to replace this with a server-side timestamp upon upload
 */
const fsServerTimestamp = firebase.firestore.FieldValue.serverTimestamp();

/**
 * Callable function to create a timestamp object representing the current moment
 */
const fsTimestampNow = firebase.firestore.Timestamp.now;

/**
 * Inserts instructions for Firebase/RTDB to relpace this with a server-side timestamp upon upload
 */
const rtServerTimestamp = firebase.database.ServerValue.TIMESTAMP;

export {
  createVanillaStorageRef,
  fsServerTimestamp,
  fsTimestampNow,
  rtServerTimestamp,
};
