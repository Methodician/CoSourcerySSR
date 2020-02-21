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
      await saveImageRotation(object);
      if (filePath?.startsWith('articleBodyImages/')) {
        // It was a body image
      }
      if (filePath?.startsWith('articleCoverImages/')) {
        // It was a cover image.
        await createCoverImageThumbnail(object);
      }
    }
  });

const saveImageRotation = async (object: functions.storage.ObjectMetadata) => {
  const { name: filePath, bucket: fileBucket } = object;
  if (!filePath) return;

  const parts = filePath.split('/');
  const articleId = parts[1];
  const bodyImageId = parts[2];

  console.log('saving image rotation');

  const tempLocalFile = path.join(
    os.tmpdir(),
    `${articleId}${bodyImageId ? '_' + bodyImageId : ''}`,
  );

  let metadata: string;
  // Download file from bucket
  // ToDo: ensure we aren't downloading it multiple times in these different operations
  const bucket = gcs.bucket(fileBucket);
  await bucket.file(filePath).download({ destination: tempLocalFile });

  const result = await cpp.spawn('identify', ['-verbose', tempLocalFile], {
    capture: ['stdout', 'stderr'],
  });
  const metaObject = imageMagickOutputToObject(result.stdout) as any;
  if (!metaObject) {
    console.error('no metadata for image');
    return;
  }

  metadata = metaObject;
  const properties = metaObject['Properties'];
  const orientation = properties['exif:Orientation'];
  console.log('orientation', orientation);

  await admin
    .database()
    .ref(`${articleId}${bodyImageId ? '_' + bodyImageId : ''}`)
    .set(metadata);

  console.log({ filePath, articleId, bodyImageId, metadata });
  fs.unlinkSync(tempLocalFile);
  console.log('cleanup successful');

  return;
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
  console.log('Metadata extracted from image', output);

  return output;
};

/**
 * Makes sure the given string does not contain characters that can't be used as Firebase
 * Realtime Database keys such as '.' and replaces them by '*'.
 */
const makeKeyFirebaseCompatible = (key: string) => {
  return key.replace(/\./g, '*');
};

// const getExifData = async (file: File, callback: Function) => {
// // -2: not jpeg
// // -1: not defined
//   const reader = new FileReader();

//   reader.onload = (event: ProgressEvent) => {
//     if (!event.target) return;

//     const file = event.target as FileReader;
//     const view = new DataView(file.result as ArrayBuffer);

//     if (view.getUint16(0, false) != 0xFFD8) {
//         return callback(-2);
//     }

//     const length = view.byteLength
//     let offset = 2;

//     while (offset < length)
//     {
//         if (view.getUint16(offset+2, false) <= 8) return callback(-1);
//         let marker = view.getUint16(offset, false);
//         offset += 2;

//         if (marker == 0xFFE1) {
//           if (view.getUint32(offset += 2, false) != 0x45786966) {
//             return callback(-1);
//           }

//           let little = view.getUint16(offset += 6, false) == 0x4949;
//           offset += view.getUint32(offset + 4, little);
//           let tags = view.getUint16(offset, little);
//           offset += 2;
//           for (let i = 0; i < tags; i++) {
//             if (view.getUint16(offset + (i * 12), little) == 0x0112) {
//               return callback(view.getUint16(offset + (i * 12) + 8, little));
//             }
//           }
//         } else if ((marker & 0xFF00) != 0xFF00) {
//             break;
//         }
//         else {
//             offset += view.getUint16(offset, false);
//         }
//     }
//     return callback(-1);
//   };

//   reader.readAsArrayBuffer(file);
//   };
// };

const createCoverImageThumbnail = async (
  object: functions.storage.ObjectMetadata,
) => {
  console.log('creating cover image thumbnail');

  const { bucket: fileBucket, name: filePath, contentType } = object;
  if (!filePath) return;

  // fileName should be an articleId...
  const fileName = path.basename(filePath);
  const bucket = gcs.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const metadata = { contentType: contentType };

  // looks like cover images on preview card ranges from 260x175 to 360x175 - let's go with a standard 260x175px thumbnail
  await bucket.file(filePath).download({ destination: tempFilePath });
  await cpp.spawn('convert', [
    tempFilePath,
    '-thumbnail',
    '260X175>',
    tempFilePath,
  ]);

  const thumbFilePath = path.join('articleCoverThumbnails', fileName);

  // Upload the thumbnail
  await bucket.upload(tempFilePath, { destination: thumbFilePath, metadata });

  // Delete local file to free up space
  fs.unlinkSync(tempFilePath);
  return null;
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
