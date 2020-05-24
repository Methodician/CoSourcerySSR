import { Injectable } from '@angular/core';

// AnguilarFire Stuff
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import {
  IArticlePreview,
  IArticleDetail,
  IVersionDetail,
} from '@models/article-info';

// RXJS stuff
import { switchMap, take, map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

// Internal stuff
import {
  rtServerTimestamp,
  fsServerTimestamp,
} from '../shared/helpers/firebase';
import { IUserInfo } from '@models/user-info';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  constructor(
    private afs: AngularFirestore,
    private afd: AngularFireDatabase,
    private storage: AngularFireStorage,
    private authSvc: AuthService,
  ) {}

  // TEMP SEEDING CODE
  // (simply call this in constructor)
  trackAllSlugs = () => {
    this.afs
      .collection<IArticlePreview>('articleData/articles/previews')
      .get()
      .pipe(
        map(querySnaps =>
          querySnaps.docs.map(docSnap => {
            const article = docSnap.data();
            const id = docSnap.id;
            return { id, slug: article.slug as string };
          }),
        ),
      )
      .subscribe(all => {
        for (let item of all) {
          console.log(item.id, item.slug);
          const slugRef = this.afd.object(`articleData/slugs/${item.slug}`);
          slugRef.set(item.id);
        }
      });
  };
  // end temp seeding code

  // RTDB REF BUILDERS

  slugIdRef = (slug: string) => this.afd.object(`articleData/slugs/${slug}`);

  // FIRESTORE REF BUILDERS

  articleDetailRef = (articleId: string) =>
    this.afs.doc<IArticleDetail>(`articleData/articles/articles/${articleId}`);

  versionDetailRef = (articleId: string, versionId: string) =>
    this.afs.doc<IArticleDetail>(
      `articleData/articles/articles/${articleId}/history/${versionId}`,
    );

  articlePreviewRef = (articleId: string) =>
    this.afs.doc<IArticlePreview>(`articleData/articles/previews/${articleId}`);

  allArticlesRef = () =>
    this.afs.collection<IArticlePreview>('articleData/articles/previews', ref =>
      ref.orderBy('lastUpdated', 'desc').where('isFlagged', '==', false),
    );

  latestArticlesRef = () =>
    this.afs.collection<IArticlePreview>('articleData/articles/previews', ref =>
      ref
        .orderBy('timestamp', 'desc')
        .where('isFlagged', '==', false)
        .limit(12),
    );

  allArticleVersionsRef = (articleId: string) =>
    this.afs.collection<IVersionDetail>(
      `/articleData/articles/articles/${articleId}/history`,
      ref => ref.orderBy('version', 'desc'),
    );

  articleVersionDetailRef = (articleId: string, version: string) =>
    this.afs.doc<IVersionDetail>(
      `articleData/articles/articles/${articleId}/history/${version}`,
    );

  // TODO: Either re-structure data to duplicate editors (array of IDs and map of edit counts) or store edit counts in RTDB or other doc?
  // Explanation: Compound queries still seem not to work. I can not do .where(`editors.${editorId}`) in addition to ordering by lastUpdated and filtering out flagged content...
  articlesByEditorRef = (editorId: string) =>
    this.afs.collection<IArticlePreview>('articleData/articles/previews', ref =>
      ref.where(`editors.${editorId}`, '>', 0),
    );

  articlesByAuthorRef = (authorId: string) =>
    this.afs.collection<IArticlePreview>('articleData/articles/previews', ref =>
      ref.where('authorId', '==', authorId).orderBy('timestamp', 'desc'),
    );

  singleBookmarkRef = (uid: string, articleId: string) =>
    this.afd.object(`userInfo/articleBookmarksPerUser/${uid}/${articleId}`);
  // end Firestore ref builders

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
            .pipe(take(1)),
        );
        return combineLatest(articleSnapshots);
      }),
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
    status: boolean,
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

  validateNewTitleAndSlug = async (newSlug: string) => {
    const newMatchId$ = this.afd
      .object<string>(`articleData/slugs/${newSlug}`)
      .valueChanges();
    const newMatchId = await newMatchId$.pipe(take(1)).toPromise();

    return !newMatchId;
  };

  updateSlug = async (newSlug: string, oldSlug: string, articleId: string) => {
    const newSlugPath = `articleData/slugs/${newSlug}`;
    const oldSlugPath = `articleData/slugs/${oldSlug}`;

    const updates = {};
    updates[newSlugPath] = articleId;
    updates[oldSlugPath] = null;
    const batch = this.afd.database.ref().update(updates);

    return batch;
  };

  updateArticle = async (article: IArticleDetail) => {
    const editorId = this.authSvc.authInfo$.value.uid;
    if (!editorId)
      throw new Error(
        "updateArticle can't be used without a valid auth state (authInfo$) in authService",
      );

    const articleRef = this.articleDetailRef(article.articleId);

    // Avoids mutating original object
    const newSlug = this.slugify(article.title);
    const articleToSave = { ...article };
    const editors = articleToSave.editors || {};
    const editsPerEditor = editors[editorId] || 0;
    editors[editorId] = editsPerEditor + 1;
    articleToSave.editors = editors;
    articleToSave.lastEditorId = editorId;
    articleToSave.lastUpdated = fsServerTimestamp;
    articleToSave.slug = newSlug;
    articleToSave.version++;

    // If slug has changed, do extra stuff
    if (newSlug !== article.slug) {
      // If new slug is already in use, return error and/or display message
      // TODO: Reflect this in server side rules validation too
      const isSlugValid = await this.validateNewTitleAndSlug(newSlug);

      if (!isSlugValid) {
        throw new Error(
          'The title is not unique enough to form a unique URL slug.',
        );
      }
      // add new slug and remove old slug
      const slugUpdateBatch = this.updateSlug(
        newSlug,
        article.slug,
        article.articleId,
      );

      // HACKY: I'm returning the slug as 3rd in tuple to indicate that a slug was updated so we can redirect in the article component. Needs re-thinking...
      return Promise.all([
        articleRef.update(articleToSave),
        slugUpdateBatch,
        newSlug,
      ]);
    }

    return articleRef.update(articleToSave);
  };

  createArticle = async (
    author: IUserInfo,
    article: IArticleDetail,
    articleId: string,
  ) => {
    if (article.articleId || !articleId)
      throw "we can't create an article without an ID, and the IArticleDetail should lack an ID";

    const authorId = this.authSvc.authInfo$.value.uid;
    if (!author || !authorId)
      throw 'New articles must have an author with an ID';

    const newSlug = this.slugify(article.title);
    const isSlugValid = await this.validateNewTitleAndSlug(newSlug);

    if (!isSlugValid) {
      throw new Error(
        'The title is not unique enough to form a unique URL slug.',
      );
    }

    const articleRef = this.articleDetailRef(articleId);

    const newArticle = {
      ...article,
      editors: {},
      authorId,
      articleId,
      lastUpdated: fsServerTimestamp,
      timestamp: fsServerTimestamp,
      lastEditorId: authorId,
      slug: newSlug,
      authorImageUrl: author.imageUrl || '../../assets/images/logo.svg',
    };

    newArticle.editors[authorId] = 1;

    const createSlugTracking = this.afd
      .object(`articleData/slugs/${newSlug}`)
      .set(articleId);
    const createArticle = articleRef.set(newArticle, { merge: true });
    return Promise.all([createSlugTracking, createArticle]);
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
      `fileUploads/articleUploads/coverThumbnails/${articleId}`,
    );
    const articleDocRef = this.afs.doc<IArticlePreview>(
      `articleData/articles/previews/${articleId}`,
    );

    const trackerSet = trackerDocRef.set({
      downloadUrl: url,
      path: storagePath,
    });
    const articleUpdate = articleDocRef.update({ imageUrl: url });
    return await Promise.all([trackerSet, articleUpdate]);
  };

  // Checks RTDB for a slug => id reference
  // if it finds it we assume we got a slug and return the result
  // otherwise we assume we got an id and return what was passed in
  // no significant performance implications because RTDB is low latency
  getIdFromSlugOrId = (slugOrId: string) =>
    this.slugIdRef(slugOrId)
      .valueChanges()
      .pipe(
        take(1),
        map((possibleId: string) => possibleId || slugOrId),
      );
  // end utility

  // HELPERS
  slugify = string => {
    const a =
      'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
    const b =
      'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
    const p = new RegExp(a.split('').join('|'), 'g');

    return string
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w\-]+/g, '') // Remove all non-word characters
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
  };

  createArticleId = () => this.afs.createId();

  processArticleTimestamps = (article: IArticlePreview | IArticleDetail) => {
    const { timestamp, lastUpdated } = article;
    if (timestamp) article.timestamp = timestamp.toDate();
    if (lastUpdated) article.lastUpdated = lastUpdated.toDate();
    return article;
  };
}
