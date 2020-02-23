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

export const onFileUpload = functions.storage
  .object()
  .onFinalize(async object => {
    const { contentType, name: filePath } = object;

    if (contentType?.startsWith('image/')) {
      // An image was uploaded.
      // await saveImageRotation(object);
      if (filePath?.startsWith('articleBodyImages/')) {
        // It was a body image
      }
      if (filePath?.startsWith('articleCoverImages/')) {
        // It was a cover image.
        await handleCoverImageUpload(object);
      }
    }
  });

// const saveImageRotation = async (object: functions.storage.ObjectMetadata) => {
//   const { name: filePath, bucket: fileBucket } = object;
//   if (!filePath) return;

//   const parts = filePath.split('/');
//   const articleId = parts[1];
//   const bodyImageId = parts[2];

//   console.log('saving image rotation');

//   const tempLocalFile = path.join(
//     os.tmpdir(),
//     `${articleId}${bodyImageId ? '_' + bodyImageId : ''}`,
//   );

//   // Download file from bucket
//   // ToDo: ensure we aren't downloading it multiple times in these different operations
//   const bucket = gcs.bucket(fileBucket);
//   await bucket.file(filePath).download({ destination: tempLocalFile });

//   const result = await cpp.spawn('identify', ['-verbose', tempLocalFile], {
//     capture: ['stdout', 'stderr'],
//   });
//   const metaObject = imageMagickOutputToObject(result.stdout) as any;
//   if (!metaObject) {
//     console.error('no metadata for image');
//     return;
//   }

//   const properties = metaObject['Properties'];
//   let orientation = properties['exif:Orientation'];
//   orientation = orientation || 0;

//   fs.unlinkSync(tempLocalFile);
//   console.log('cleanup successful');

//   return;
// };

const handleCoverImageUpload = async (
  object: functions.storage.ObjectMetadata,
) => {
  const { bucket: fileBucket, name: filePath, contentType } = object;

  if (!filePath) return;

  // fileName should be an articleId...
  const articleId = path.basename(filePath);
  const bucket = gcs.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), articleId);

  // Downloading once for all operations. Avoid doing this more times than necessary
  await bucket.file(filePath).download({ destination: tempFilePath });

  const orientation = await getImageEXIFOrientation(tempFilePath);

  await uploadCoverImageOrientation(orientation, articleId);
  await createCoverImageThumbnail(
    tempFilePath,
    articleId,
    contentType || 'none',
    fileBucket,
  );

  // Delete local file to free up space
  fs.unlinkSync(tempFilePath);
  return null;
};

const uploadCoverImageOrientation = (
  orientation: number,
  articleId: string,
) => {
  const rtdb = admin.database();
  const dbRef = rtdb.ref(`articleData/meta/${articleId}/imageData/coverImage`);

  return dbRef.update({ orientation });
};

/**
 *
 * @param localFilePath the path for a file that has been downloaded locally on server
 */
const getImageEXIFOrientation = async (
  localFilePath: string,
): Promise<number> => {
  const result = await cpp.spawn('identify', ['-verbose', localFilePath], {
    capture: ['stdout', 'stderr'],
  });
  const metaObject = imageMagickOutputToObject(result.stdout) as any;
  if (!metaObject) {
    console.log('no metadata for image. Using 0 for image orientation.');

    return 0;
  }

  const properties = metaObject['Properties'];
  const orientation = properties['exif:Orientation'];

  return orientation || 0;
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

/**
 * Convert the output of ImageMagick's `identify -verbose` command to a JavaScript Object.
 */
const imageMagickOutputToObject = (input: string) => {
  let previousLineIndent = 0;
  const lines = input.match(/[^\r\n]+/g);
  if (!lines) {
    console.log('no lines to parse for exif');

    return;
  }

  lines.shift(); // Remove First line
  lines.forEach((currentLine, index) => {
    if (!lines) {
      console.error('lines dissolved while parsing for exif. Weird...');

      return;
    }

    const currentIdent = currentLine.search(/\S/);
    const line = currentLine.trim();
    if (line.endsWith(':')) {
      lines[index] = makeKeyFirebaseCompatible(`"${line.replace(':', '":{')}`);
    } else {
      const split = line.replace('"', '\\"').split(': ');
      split[0] = makeKeyFirebaseCompatible(split[0]);
      lines[index] = `"${split.join('":"')}",`;
    }
    if (currentIdent < previousLineIndent) {
      lines[index - 1] = lines[index - 1].substring(
        0,
        lines[index - 1].length - 1,
      );
      lines[index] =
        new Array(1 + (previousLineIndent - currentIdent) / 2).join('}') +
        ',' +
        lines[index];
    }
    previousLineIndent = currentIdent;
  });
  let output = lines.join('');
  output = '{' + output.substring(0, output.length - 1) + '}'; // remove trailing comma.
  output = JSON.parse(output);

  return output;
};

/**
 * Makes sure the given string does not contain characters that can't be used as Firebase
 * Realtime Database keys such as '.' and replaces them by '*'.
 */
const makeKeyFirebaseCompatible = (key: string) => {
  return key.replace(/\./g, '*');
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

// interface IBodyImageMeta {
//   orientation: number;
//   // Should remove path...
//   path?: string;
// }

// interface IBodyImageMap extends IKeyMap<IBodyImageMeta> {}

interface IKeyMap<T> {
  [key: string]: T;
}
