import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { Storage } from '@google-cloud/storage';
const gcs = new Storage();

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import * as cpp from 'child-process-promise';

admin.initializeApp();
const adminFS = admin.firestore();
const adminDB = admin.database();

export const trackCommentDeletions = functions.database
  .ref('commentData/comments/{commentKey}/removedAt')
  .onCreate(async (snap, context) => {
    const commentKey = context.params.commentKey;
    const commentRef = snap.ref.parent;

    if (!commentRef || !commentRef.parent || !commentRef.parent.parent)
      throw new Error('one of the references is null or undefined');

    const archiveRef = commentRef.parent.parent.child(
      `commentArchive/${commentKey}`,
    );
    const commentSnap = await commentRef.once('value').then();
    return Promise.all([
      archiveRef.set(commentSnap.val()),
      commentRef.update({ text: 'This comment was removed.' }),
    ]);
  });

const trackArticleAuthorship = (article: any) => {
  const authorId = article.authorId;
  const articleId = article.articleId;
  const createdAt = new Date(article.timestamp.toDate()).getTime();
  const ref = adminDB.ref(
    `userInfo/articlesAuthoredPerUser/${authorId}/${articleId}`,
  );
  return ref.set(createdAt);
};

const createArticlePreview = (article: any, id: string) => {
  const previewRef = adminFS.doc(`articleData/articles/previews/${id}`);
  const preview = previewFromArticle(article);

  return previewRef.set(preview).catch(error => console.log(error));
};

const previewFromArticle = (articleObject: IArticleDetail): IArticlePreview => {
  const {
    articleId,
    authorId,
    title,
    introduction,
    lastUpdated,
    timestamp,
    version,
    editors,
    commentCount,
    viewCount,
    tags,
    imageUrl,
    imageAlt,
    slug,
  } = articleObject;
  const previewImageUrl = imageUrl && imageUrl.length > 0 ? 'unset' : '';

  const preview: IArticlePreview = {
    articleId,
    authorId,
    title,
    introduction,
    imageAlt,
    lastUpdated,
    timestamp,
    version,
    editors,
    commentCount,
    viewCount,
    tags,
    isFlagged: false,
    imageUrl: previewImageUrl,
    slug,
  };

  return preview;
};

export const onCreateArticleDetail = functions.firestore
  .document('articleData/articles/articles/{articleId}')
  .onCreate(async (snap, context) => {
    const id = context.params.articleId;
    const article = snap.data();

    try {
      console.log('handling ArticleDetail creation');
      await trackArticleAuthorship(article);
      await createArticlePreview(article, id);
    } catch (error) {
      console.error('There was an issue handling article creation', error);
    }
  });

export const onWriteArticleDetail = functions.firestore
  .document('articleData/articles/articles/{articleId}')
  .onWrite(async (change, context) => {
    const article = change.after.data();
    const id = context.params.articleId;

    if (context.eventType !== 'google.firestore.document.delete') {
      console.log('handling Article Detail update');
      return createArticlePreview(article, id);
    }
  });



// TODO: Figure out a good way to share models and functions between app and cloud

interface IArticlePreview {
  articleId: string;
  authorId: string;
  title: string;
  introduction: string;
  imageUrl: string;
  imageAlt: string;
  lastUpdated: any;
  timestamp: any;
  version: number;
  editors: IKeyMap<number>;
  slug: string;
  commentCount?: number;
  viewCount?: number;
  tags?: string[];
  isFlagged?: boolean;
}

interface IArticleDetail {
  articleId: string;
  authorId: string;
  title: string;
  introduction: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  authorImageUrl: string;
  lastUpdated: any;
  timestamp: any;
  lastEditorId: string;
  version: number;
  editors: IKeyMap<number>;
  slug: string;
  commentCount?: number;
  viewCount?: number;
  tags?: string[];
  isFeatured?: boolean;
  isFlagged?: boolean;
  bodyImages?: IBodyImageMap;
}

interface IBodyImageMeta {
  orientation: number;
  path: string;
}

interface IBodyImageMap extends IKeyMap<IBodyImageMeta> {}

interface IKeyMap<T> {
  [key: string]: T;
}
