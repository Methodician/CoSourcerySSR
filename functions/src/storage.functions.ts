import * as functions from 'firebase-functions';
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
  const { bucket, name, contentType, metadata } = object;

  if (!name) {
    console.error('no file path (aka name)');
    return;
  }
  if (!metadata) {
    console.error('no object metadata');
    return;
  }

  // fileName should be an articleId...
  const parsedName = path.parse(name);
  const splitDir = parsedName.dir.split('/');
  const imageId = parsedName.base;
  const articleId = splitDir[splitDir.length - 1];

  const gcsBucket = gcs.bucket(bucket);
  const tempFilePath = path.join(
    os.tmpdir(),
    `coverImage_${articleId}_${imageId}`,
  );

  // Downloading once for all operations. Avoid doing this more times than necessary
  await gcsBucket.file(name).download({ destination: tempFilePath });

  await rotateUploadedImage(
    metadata,
    tempFilePath,
    name,
    bucket,
    contentType || 'none',
  );

  await createCoverImageThumbnail(
    tempFilePath,
    articleId,
    imageId,
    contentType || 'none',
    bucket,
  );

  // Delete local file to free up space
  fs.unlinkSync(tempFilePath);
  return null;
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
  imageId: string,
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
  const thumbFilePath = path.join('articleCoverThumbnails', articleId, imageId);
  const bucket = gcs.bucket(fileBucket);

  // Upload the thumbnail
  await bucket.upload(localFilePath, { destination: thumbFilePath, metadata });
};
