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

/*

[x] onUpdateArticleDetail
    [x] trackArticleEditors
[x] onCreateArticleDetail
    [x] trackArticleAuthorship
[x] createHistoryObject (onWrite)
[x] createPreviewObject (onWrite)
[ ] updateAlgoliaIndex
[x] trackCommentVotes (onWrite[votesByUser-uid-commentKey])
[x] trackCommentDeletions (onCreate[removedAt])
[x] bubbleUpCommentCount (onUpdate[replyCount])
    [x] incrementReplyCount
    [x] incrementCommentCount
[x] countNewComment (onCreate)
    [x] incrementReplyCount
    [x] incrementCommentCount
[x] trackCommentAuthorsAndParents (onCreate)
[x] trackFileUploads
    [x] createCoverImageThumbnail
*/
