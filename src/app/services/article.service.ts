import { Injectable } from '@angular/core';

// AnguilarFire Stuff
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { ArticlePreview, ArticleDetail } from '@models/interfaces/article-info';

// RXJS stuff
import { switchMap, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import {
  rtServerTimestamp,
  fsServerTimestamp,
} from '../shared/helpers/firebase';
import { UserInfo } from '@models/interfaces/user-info';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  constructor(
    private afs: AngularFirestore,
    private afd: AngularFireDatabase,
    private storage: AngularFireStorage
  ) {}

  // FIRESTORE REF BUILDERS
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

  singleBookmarkRef = (uid: string, articleId: string) =>
    this.afd.object(`userInfo/articleBookmarksPerUser/${uid}/${articleId}`);
  // end firestore ref builders

  // BOOKMARK STUFF
  watchBookmarkedArticles = (uid: string) => {
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

  unBookmarkArticle = (uid: string, articleId: string) => {
    const updates = {};
    updates[`userInfo/articleBookmarksPerUser/${uid}/${articleId}`] = null;
    updates[`articleData/userBookmarksPerArticle/${articleId}/${uid}`] = null;
    this.afd.database.ref().update(updates);
  };

  bookmarkArticle = (uid: string, articleId: string) => {
    const updates = {};
    updates[
      `userInfo/articleBookmarksPerUser/${uid}/${articleId}`
    ] = rtServerTimestamp;
    updates[
      `articleData/userBookmarksPerArticle/${articleId}/${uid}`
    ] = rtServerTimestamp;
    this.afd.database.ref().update(updates);
  };
  // end bookmark stuff

  // EDITORS STUFF
  currentEditorsRef = (articleId: string) =>
    this.afd.list(`articleData/editStatus/editorsByArticle/${articleId}`);

  updateArticleEditStatus = (
    articleId: string,
    editorId: string,
    status: boolean
  ) => {
    const editorsPath = `articleData/editStatus/editorsByArticle/${articleId}/${editorId}`;
    const articlesPath = `articleData/editStatus/articlesByEditor/${editorId}/${articleId}`;

    const editorsRef = this.afd.database.ref(editorsPath);
    const articlesRef = this.afd.database.ref(articlesPath);
    const updates = {};

    updates[editorsPath] = status ? status : null;
    updates[articlesPath] = status ? status : null;

    editorsRef.onDisconnect().set(null);
    articlesRef.onDisconnect().set(null);

    return this.afd.database.ref().update(updates);
  };

  // end editors stuff

  // UTILITY
  updateArticle = (editor: UserInfo, article: ArticleDetail) => {
    const articleRef = this.articleDetailRef(article.articleId);

    // Avoids mutating original object
    const articleToSave = { ...article };
    const editors = articleToSave.editors || {};
    const editCount = editors[editor.uid] || 0;
    editors[editor.uid] = editCount + 1;
    articleToSave.editors = editors;
    articleToSave.lastEditorId = editor.uid;
    articleToSave.lastUpdated = fsServerTimestamp;
    articleToSave.version++;
    // articleToSave.bodyImages = this.cleanArticleImages(articleToSave);
    return articleRef.update(articleToSave);
  };

  setThumbnailImageUrl = async (articleId: string) => {
    const storagePath = `articleCoverThumbnails/${articleId}`;
    const storageRef = this.storage.ref(storagePath);
    const url = await storageRef.getDownloadURL().toPromise();
    const trackerDocRef = this.afs.doc(
      `fileUploads/articleUploads/coverThumbnails/${articleId}`
    );
    const articleDocRef = this.afs.doc<ArticlePreview>(
      `articleData/articles/previews/${articleId}`
    );

    const trackerSet = trackerDocRef.set({
      downloadUrl: url,
      path: storagePath,
    });
    const articleUpdate = articleDocRef.update({ imageUrl: url });
    return await Promise.all([trackerSet, articleUpdate]);
  };
  // end utility

  // HELPERS
  createArticleId = () => this.afs.createId();

  processArticleTimestamps = (article: ArticlePreview | ArticleDetail) => {
    const { timestamp, lastUpdated } = article;
    if (timestamp) article.timestamp = timestamp.toDate();
    if (lastUpdated) article.lastUpdated = lastUpdated.toDate();
    return article;
  };
}
