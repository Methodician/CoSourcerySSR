import firebase from '@firebase/app';
import '@firebase/storage';
import '@firebase/firestore';
import '@firebase/database';

const createVanillaStorageRef = (path: string) => {
  return firebase.storage().ref(path);
};

const fsServerTimestamp = firebase.firestore.FieldValue.serverTimestamp();
const fsTimestampNow = firebase.firestore.Timestamp.now();

const rtServerTimestamp = firebase.database.ServerValue.TIMESTAMP;

export {
  createVanillaStorageRef,
  fsServerTimestamp,
  fsTimestampNow,
  rtServerTimestamp,
};
