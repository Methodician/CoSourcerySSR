import firebase from "@firebase/app";
import "@firebase/storage";
import "@firebase/firestore";
import "@firebase/database";

const createVanillaStorageRef = (path: string) => {
  return firebase.storage().ref(path);
};

const fsServerTimestamp = firebase.firestore.FieldValue.serverTimestamp();
const dbServerTimestamp = firebase.database.ServerValue.TIMESTAMP;

export { createVanillaStorageRef, fsServerTimestamp, dbServerTimestamp };
