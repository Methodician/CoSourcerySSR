import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as cpp from 'child-process-promise';

import { Storage } from '@google-cloud/storage';
const gcs = new Storage();

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

  const imageRotationMarker = Math.random().toString(36).substr(2, 5);

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
