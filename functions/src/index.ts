import * as admin from 'firebase-admin';

admin.initializeApp();

export const FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';
export const FIRESTORE_EMULATOR_HOST = 'localhost:8080';

export {
  onCommentCreated,
  onReplyCountUpdate,
  onCommentVoteWrite,
  onCommentDeletionTriggered,
} from './comment.functions';

export {
  onCreateArticleDetail,
  onWriteArticleDetail,
  onUpdateArticleDetail,
} from './article.functions';

export { onFileUpload } from './storage.functions';
