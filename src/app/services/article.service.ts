import { Injectable } from '@angular/core';

// AnguilarFire Stuff
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection,
  QueryFn,
} from '@angular/fire/firestore';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import {
  IArticlePreview,
  IArticleDetail,
} from '@models/interfaces/article-info';

// RXJS stuff
import { switchMap, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import {
  rtServerTimestamp,
  fsServerTimestamp,
} from '../shared/helpers/firebase';
import { IUserInfo } from '@models/interfaces/user-info';

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
  articleDetailRef = (
    articleId: string
  ): AngularFirestoreDocument<IArticleDetail> =>
    this.afs.doc(`articleData/articles/articles/${articleId}`);

  articlePreviewRef = (
    articleId: string
  ): AngularFirestoreDocument<IArticlePreview> =>
    this.afs.doc(`articleData/articles/previews/${articleId}`);

  allArticlesRef = (): AngularFirestoreCollection<IArticlePreview> =>
    this.afs.collection('articleData/articles/previews', ref =>
      ref.orderBy('lastUpdated', 'desc').where('isFlagged', '==', false)
    );

  latestArticlesRef = (): AngularFirestoreCollection<IArticlePreview> =>
    this.afs.collection('articleData/articles/previews', ref =>
      ref
        .orderBy('timestamp', 'desc')
        .where('isFlagged', '==', false)
        .limit(12)
    );

  // TODO: Figure out if an approach like this could allow for better composition with above queries
  articlesByEditorQuery = (editorId: string) =>
    this.articlesRef(ref =>
      ref
        .orderBy(`editors.${editorId}`)
        .where(`editors.${editorId}`, '>', 0)
        .orderBy('lastUpdated', 'desc')
        .where('isFlagged', '==', false)
    );

  articlesRef = (queryFn: QueryFn) =>
    this.afs.collection<IArticlePreview>(
      'articleData/articles/previews',
      queryFn
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
  updateArticle = (editor: IUserInfo, article: IArticleDetail) => {
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
    // TODO: Deterimine if we still need the cleanArticleImages action
    // articleToSave.bodyImages = this.cleanArticleImages(articleToSave);
    return articleRef.update(articleToSave);
  };

  createArticle = (
    author: IUserInfo,
    article: IArticleDetail,
    articleId: string
  ) => {
    if (article.articleId || !articleId)
      throw "we can't create an article without an ID, and the IArticleDetail should lack an ID";
    if (!author || !author.uid)
      throw 'New articles must have an author with an ID';

    const articleRef = this.articleDetailRef(articleId);
    const newArticle = { ...article };
    newArticle.editors = {};
    newArticle.editors[author.uid] = 1;
    newArticle.authorId = author.uid;
    newArticle.articleId = articleId;
    newArticle.lastUpdated = fsServerTimestamp;
    newArticle.timestamp = fsServerTimestamp;
    newArticle.lastEditorId = author.uid;
    newArticle.authorImageUrl =
      author.imageUrl || '../../assets/images/logo.svg';

    return articleRef.set(newArticle, { merge: true });
  };

  uploadCoverImage = (articleId: string, file: File) => {
    try {
      const storageRef = this.storage.ref(`articleCoverImages/${articleId}`);
      const task = storageRef.put(file);
      return { task, ref: storageRef };
    } catch (error) {
      console.error(error);
    }
  };

  setThumbnailImageUrl = async (articleId: string) => {
    const storagePath = `articleCoverThumbnails/${articleId}`;
    const storageRef = this.storage.ref(storagePath);
    const url = await storageRef.getDownloadURL().toPromise();
    const trackerDocRef = this.afs.doc(
      `fileUploads/articleUploads/coverThumbnails/${articleId}`
    );
    const articleDocRef = this.afs.doc<IArticlePreview>(
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

  processArticleTimestamps = (article: IArticlePreview | IArticleDetail) => {
    const { timestamp, lastUpdated } = article;
    if (timestamp) article.timestamp = timestamp.toDate();
    if (lastUpdated) article.lastUpdated = lastUpdated.toDate();
    return article;
  };
}
