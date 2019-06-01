import { Injectable } from '@angular/core';

// AnguilarFire Stuff
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { ArticlePreview, ArticleDetail } from '@models/interfaces/article-info';

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

  // Firestore Ref Builders

  articleDetailRef = (id: string): AngularFirestoreDocument<ArticleDetail> =>
    this.afs.doc(`articleData/articles/articles/${id}`);

  articlePreviewRef = (id: string): AngularFirestoreDocument<ArticlePreview> =>
    this.afs.doc(`articleData/articles/previews/${id}`);

  allArticlesRef = (): AngularFirestoreCollection<ArticlePreview> =>
    this.afs.collection('articleData/articles/previews', ref =>
      ref.orderBy('lastUpdated', 'desc').where('isFlagged', '==', false)
    );

  latestArticlesRef = (): AngularFirestoreCollection<ArticlePreview> =>
    this.afs.collection('articleData/articles/previews', ref =>
      ref
        .orderBy('timestamp', 'desc')
        .where('isFlagged', '==', false)
        .limit(12)
    );

  watchBookmarkedArticles = uid => {
    const bookmarks$ = this.afd
      .list(`userInfo/articleBookmarksPerUser/${uid}`)
      .snapshotChanges();

    return bookmarks$.pipe(
      switchMap(bookmarkSnaps => {
        // switchMap is like map but removes observable nesting
        const keys = bookmarkSnaps.map(snap => snap.key);
        const articleSnapshots = keys.map(key =>
          this.articlePreviewRef(key)
            .valueChanges()
            .pipe(take(1))
        );
        return combineLatest(articleSnapshots);
      })
    );
  };

  // Feeling clever - doing above in effectively one line of code does not make it better...
  // watchBookmarkedArticles = uid =>
  //   this.afd
  //     .list(`userInfo/articleBookmarksPerUser/${uid}`)
  //     .snapshotChanges()
  //     .pipe(
  //       switchMap(bookmarkSnaps =>
  //         combineLatest(
  //           bookmarkSnaps
  //             .map(snap => snap.key)
  //             .map(key =>
  //               this.articlePreviewRef(key)
  //                 .valueChanges()
  //                 .pipe(take(1))
  //             )
  //         )
  //       )
  //     );

  // HELPERS
  createArticleId = () => this.afs.createId();
}
