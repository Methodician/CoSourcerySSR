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

// Often got memory limit exceeded (arbitrary for same photo sometimes and sometimes not)
const generousRuntimeOptions: functions.RuntimeOptions = {
  timeoutSeconds: 120,
  memory: '512MB',
};

export const onFileUpload = functions
  .runWith(generousRuntimeOptions)
  .storage.object()
  .onFinalize(async object => {
    const { contentType, name: filePath } = object;

    if (contentType?.startsWith('image/')) {
      // An image was uploaded.
      if (filePath?.startsWith('articleBodyImages/')) {
        // It was a body image
      }
      if (filePath?.startsWith('articleCoverImages/')) {
        // It was a cover image.
        await handleCoverImageUpload(object);
      }
    }
  });

const handleCoverImageUpload = async (
  object: functions.storage.ObjectMetadata,
) => {
  const {
    bucket: fileBucket,
    name: filePath,
    contentType,
    metadata: objectMeta,
  } = object;

  if (!filePath) {
    console.error('no file path');
    return;
  }
  if (!objectMeta) {
    console.error('no object metadata');
    return;
  }

  // fileName should be an articleId...
  const articleId = path.basename(filePath);
  const bucket = gcs.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), `coverImage_${articleId}`);

  // Downloading once for all operations. Avoid doing this more times than necessary
  await bucket.file(filePath).download({ destination: tempFilePath });

  await rotateUploadedImage(
    objectMeta,
    tempFilePath,
    filePath,
    fileBucket,
    contentType || 'none',
  );

  const coverImageThumbnailPromise = createCoverImageThumbnail(
    tempFilePath,
    articleId,
    contentType || 'none',
    fileBucket,
  );

  const hackyArticleUpdatePromise = addQueryParamToUpdateImage(articleId);

  await Promise.all([hackyArticleUpdatePromise, coverImageThumbnailPromise]);

  // Delete local file to free up space
  fs.unlinkSync(tempFilePath);
  return null;
};

const addQueryParamToUpdateImage = async (articleId: string) => {
  // HACKY: Force update to articleData so the article refreshes with new image... Still leaves limbo moment for EXIF images. Gotta be a better way...
  const articleRef = admin
    .firestore()
    .collection('articleData')
    .doc('articles')
    .collection('articles')
    .doc(articleId);

  const imageRotationMarker = Math.random()
    .toString(36)
    .substr(2, 5);

  const snap = await articleRef.get();
  const article = snap.data();

  if (!article) return;

  const coverImageUrl = article.imageUrl;
  return articleRef.update({
    imageUrl: `${coverImageUrl}&m=${imageRotationMarker}`,
  });
};

const rotateUploadedImage = async (
  objectMeta: { [key: string]: string },
  localFilePath: string,
  storageFilePath: string,
  fileBucket: string,
  contentType: string,
) => {
  const bucket = gcs.bucket(fileBucket);
  if (objectMeta && objectMeta.autoOrient && objectMeta.autoOrient === 'done') {
    console.log('the image was already rotated.');
  } else if (objectMeta) {
    console.log('rotating image');
    await cpp.spawn('convert', [localFilePath, '-auto-orient', localFilePath]);
    objectMeta.autoOrient = 'done';
    objectMeta.contentType = contentType;
    await bucket.upload(localFilePath, {
      destination: storageFilePath,
      metadata: { metadata: objectMeta },
    });
    console.log('uploaded rotated file');
    return null;
  }
  return null;
};

/**
 * This modifies the file. Avoid calling it before other operations that use the original file just in case...
 *
 * @param localFilePath the path for a file that has been downloaded locally on server
 * @param articleId id of the article the cover image is for
 * @param contentType image content type
 * @param fileBucket name of the file bucket for use in creating a bucket reference thingy
 */
const createCoverImageThumbnail = async (
  localFilePath: string,
  articleId: string,
  contentType: string,
  fileBucket: string,
) => {
  console.log('creating cover image thumbnail');

  await cpp.spawn('convert', [
    localFilePath,
    '-thumbnail',
    '260X175>',
    localFilePath,
  ]);

  const metadata = { contentType: contentType };
  const thumbFilePath = path.join('articleCoverThumbnails', articleId);
  const bucket = gcs.bucket(fileBucket);

  // Upload the thumbnail
  await bucket.upload(localFilePath, { destination: thumbFilePath, metadata });
};

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
}

// interface IBodyImageMap extends IKeyMap<IBodyImageMeta> {}

interface IKeyMap<T> {
  [key: string]: T;
}
