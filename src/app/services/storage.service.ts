import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { of, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor(private storage: AngularFireStorage) {}

  getImageUrl = (path: string) => {
    const url$ = new BehaviorSubject('');
    const storageRef = this.storage.ref(path);
    storageRef.getDownloadURL().subscribe(
      url => {
        url$.next(url);
      },
      error => {
        if (error.code !== 'storage/object-not-found') {
          console.warn('We should handle other cases such as:');
          console.error(error);
        }
      }
    );

    return url$;
  };
}
