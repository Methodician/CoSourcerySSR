import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

// AnguilarFire Stuff
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { ArticlePreviewI, ArticleDetailI } from '@shared_models/article.models';

// RXJS stuff
import { switchMap, take, map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

// Internal stuff

import { FirebaseService } from '@services/firebase.service';
import { IUserInfo } from '@models/user-info';
import { AuthService } from './auth.service';
import { isPlatformServer } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  pendingImageUploadCount = 0;

  constructor(
    private afs: AngularFirestore,
    private afd: AngularFireDatabase,
    private storage: AngularFireStorage,
    private authSvc: AuthService,
    private fbSvc: FirebaseService,
    @Inject(PLATFORM_ID) private platform: Object,
  ) {}

  // TEMP SEEDING CODE
  // (simply call this in constructor or elsewhere)

  scanAllArticlesAndRelocateImages = async () => {
    const relocateArticleImages = async (articleId: string) => {
      const uploadImage = (path: string, file: Blob) => {
        try {
          const storageRef = this.storage.ref(path);
          const task = storageRef.put(file);

          return { task, storageRef };
        } catch (error) {
          console.error(error);
        }
      };

      const relocateImage = async (oldPath: string, newPath: string) => {
        const oldRef = this.storage.ref(oldPath);
        const url = await oldRef.getDownloadURL().toPromise();
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';

        xhr.onload = async _ => {
          const blob = xhr.response;
          const { task } = uploadImage(newPath, blob);
          task.then(taskSnap => {
            if (taskSnap.state === 'success') {
              console.log(`the image upload succeeded for ${articleId}`);
            } else {
              console.warn(
                `the image upload failed for ${articleId} - here's the snapshot:`,
                taskSnap,
              );
            }
          });
        };

        xhr.open('GET', url);
        return xhr.send();
      };

      const relocateCoverImage = (articleId: string, imageId: string) => {
        const oldPath = `articleCoverImages/${articleId}`;
        const newPath = `articleCoverThumbnails/${articleId}/${imageId}`;
        return relocateImage(oldPath, newPath);
      };

      const relocateCoverThumbnail = async (
        articleId: string,
        imageId: string,
      ) => {
        const oldPath = `articleCoverThumbnails/${articleId}`;
        const newPath = `articleCoverThumbnails/${articleId}/${imageId}`;
        return relocateImage(oldPath, newPath);
      };

      const newImageId = this.createId();
      const coverImagePromise = relocateCoverImage(articleId, newImageId);
      const thumbnailPromise = relocateCoverThumbnail(articleId, newImageId);
      await Promise.all([coverImagePromise, thumbnailPromise]);

      const articleRef = this.articleDetailRef(articleId);
      await articleRef.update({ coverImageId: newImageId });
      return { articleId, newImageId };
    };

    const querySnap = await this.allArticlesRef().get().toPromise();
    const relocationPromises = [];

    for (let docSnap of querySnap.docs) {
      const { articleId, coverImageId } = docSnap.data();
      if (!coverImageId) {
        relocationPromises.push(relocateArticleImages(articleId));
      }
    }

    return Promise.all(relocationPromises);
  };

  trackAllSlugs = () => {
    this.afs
      .collection<ArticlePreviewI>('articleData/articles/previews')
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

  // Work-around for Firestore emulator suite bug:
  addPointlessDocuments = async () => {
    console.log('adding pointless stuff');
    const firstPoint = await this.afs
      .collection('articleData')
      .doc('articles')
      .set({ pointless: 'thing' }, { merge: true });
    console.log('should have set articles', firstPoint);

    const secondPoint = await this.afs
      .collection('fileUploads')
      .doc('articleUploads')
      .set({ pointless: 'thing' });

    console.log('should have set articleUploads', secondPoint);

    const lastPoint = await this.afs
      .collection('fileUploads')
      .doc('profileUploads')
      .set({ pointless: 'thing' });
    console.log('should have set profileUploads', lastPoint);
    return { firstPoint, secondPoint, lastPoint };
  };
  // end temp seeding code

  // RTDB REF BUILDERS

  slugIdRef = (slug: string) => this.afd.object(`articleData/slugs/${slug}`);

  // FIRESTORE REF BUILDERS

  articleDetailRef = (articleId: string) =>
    this.afs.doc<ArticleDetailI>(`articleData/articles/articles/${articleId}`);

  versionDetailRef = (articleId: string, versionId: string) =>
    this.afs.doc<ArticleDetailI>(
      `articleData/articles/articles/${articleId}/history/${versionId}`,
    );

  articlePreviewRef = (articleId: string) =>
    this.afs.doc<ArticlePreviewI>(`articleData/articles/previews/${articleId}`);

  allArticlesRef = () =>
    this.afs.collection<ArticlePreviewI>('articleData/articles/previews', ref =>
      ref.orderBy('lastUpdated', 'desc').where('isFlagged', '==', false),
    );

  latestArticlesRef = () =>
    this.afs.collection<ArticlePreviewI>('articleData/articles/previews', ref =>
      ref
        .orderBy('timestamp', 'desc')
        .where('isFlagged', '==', false)
        .limit(12),
    );

  allArticleVersionsRef = (articleId: string) =>
    this.afs.collection<ArticleDetailI>(
      `/articleData/articles/articles/${articleId}/history`,
      ref => ref.orderBy('version', 'desc'),
    );

  articleVersionDetailRef = (articleId: string, version: string) =>
    this.afs.doc<ArticleDetailI>(
      `articleData/articles/articles/${articleId}/history/${version}`,
    );

  // TODO: Either re-structure data to duplicate editors (array of IDs and map of edit counts) or store edit counts in RTDB or other doc?
  // Explanation: Compound queries still seem not to work. I can not do .where(`editors.${editorId}`) in addition to ordering by lastUpdated and filtering out flagged content...
  articlesByEditorRef = (editorId: string) =>
    this.afs.collection<ArticlePreviewI>('articleData/articles/previews', ref =>
      ref.where(`editors.${editorId}`, '>', 0),
    );

  articlesByAuthorRef = (authorId: string) =>
    this.afs.collection<ArticlePreviewI>('articleData/articles/previews', ref =>
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
          this.articlePreviewRef(key).valueChanges().pipe(take(1)),
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
    ] = this.fbSvc.rtServerTimestamp;
    updates[
      `articleData/userBookmarksPerArticle/${articleId}/${uid}`
    ] = this.fbSvc.rtServerTimestamp;
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
    // the onDisconnect stuff seems to rely on browser API, I thin setTimeout()
    // and none of this needs to happen server-side anyway...
    if (isPlatformServer(this.platform)) return;

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

  updateArticle = async (article: ArticleDetailI) => {
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
    articleToSave.lastUpdated = this.fbSvc.fsServerTimestamp();
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
    article: ArticleDetailI,
    articleId: string,
  ) => {
    if (article.articleId || !articleId)
      throw "we can't create an article without an ID, and the ArticleDetailI should lack an ID";

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
      lastUpdated: this.fbSvc.fsServerTimestamp(),
      timestamp: this.fbSvc.fsServerTimestamp(),
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
      const newImageId = this.createId();
      const storageRef = this.storage.ref(
        `articleCoverImages/${articleId}/${newImageId}`,
      );
      const task = storageRef.put(file);
      return { task, storageRef, newImageId };
    } catch (error) {
      console.error(error);
    }
  };

  uploadBodyImage = (articleId: string, imageId: string, image: File) => {
    try {
      if (!articleId || !imageId) {
        throw new Error(
          'Body images must be associated with an article id and an imageId one or more were not provided.',
        );
      }

      const { name, type } = image;
      const isImage = type.startsWith('image/');

      if (!isImage) {
        throw new Error(
          'Only images can be uploaded for body images. This seems to be another file type.',
        );
      }

      const fileExtension = name.slice(((name.lastIndexOf('.') - 1) >>> 0) + 2);
      const storageRef = this.storage.ref(
        `articleBodyImages/${articleId}/${imageId}.${fileExtension}`,
      );
      const task = storageRef.put(image);
      return { task, storageRef };
    } catch (error) {
      console.error(error);
    }
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

  createId = () => this.afs.createId();

  processArticleTimestamps = (article: ArticlePreviewI | ArticleDetailI) => {
    const { timestamp, lastUpdated } = article;
    if (timestamp) article.timestamp = timestamp.toDate();
    if (lastUpdated) article.lastUpdated = lastUpdated.toDate();
    return article;
  };
}
