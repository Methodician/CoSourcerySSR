import { Injectable } from '@angular/core';

// AnguilarFire Stuff
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { ArticlePreview } from '@models/interfaces/article-info';

// RXJS stuff
import { switchMap, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  constructor(
    private afs: AngularFirestore,
    private afd: AngularFireDatabase
  ) {}

  articlePreviewRef = (
    id: string
  ): AngularFirestoreDocument<ArticlePreview> => {
    return this.afs.doc(`articleData/articles/previews/${id}`);
  };

  allArticlesRef = (): AngularFirestoreCollection<ArticlePreview> => {
    return this.afs.collection('articleData/articles/previews', ref =>
      ref.orderBy('lastUpdated', 'desc').where('isFlagged', '==', false)
    );
  };

  latestArticlesRef = (): AngularFirestoreCollection<ArticlePreview> => {
    return this.afs.collection('articleData/articles/previews', ref =>
      ref
        .orderBy('timestamp', 'desc')
        .where('isFlagged', '==', false)
        .limit(12)
    );
  };

  watchBookmarkedArticles = uid => {
    const bookmarksRef: AngularFireList<Number> = this.afd.list(
      `userInfo/articleBookmarksPerUser/${uid}`
    );
    return bookmarksRef.snapshotChanges().pipe(
      switchMap(bookmarkSnaps => {
        // switchMap is like map but removes observable nesting
        const keys = bookmarkSnaps.map(snap => snap.key);
        const snapshots = keys.map(key =>
          this.articlePreviewRef(key)
            .valueChanges()
            .pipe(take(1))
        );
        return combineLatest(snapshots);
      })
    );
  };
}
