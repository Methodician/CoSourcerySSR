import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ParentTypesE, CommentI } from '../../shared_models/index';
const adminFS = admin.firestore();
const adminDB = admin.database();

export const onCommentCreated = functions.database
  .ref('commentData/comments/{commentKey}')
  .onCreate((snap, context) => {
    const comment: CommentI = snap.val();
    const { parentKey, authorId, parentType } = comment;
    const { commentKey } = context.params;
    const commentRef = snap.ref;

    // track comment for lookup map
    const setCommentsByParent = commentRef
      .parent!.parent!.child(`commentsByParent/${parentKey}/${commentKey}`)
      .set(true);

    // track author for lookup map
    const setCommentsByAuthor = commentRef
      .parent!.parent!.child(`commentsByAuthor/${authorId}/${commentKey}`)
      .set(true);

    // count comment (triggers bubble up)
    const incrementCommentCount = async () => {
      const articleDocRef = adminFS
        .collection('articleData')
        .doc('articles')
        .collection('articles')
        .doc(parentKey);

      await articleDocRef.update({
        commentCount: admin.firestore.FieldValue.increment(1),
      });

      return;
    };

    const incrementReplyCount = () => {
      const replyCountRef = adminDB.ref(
        `commentData/comments/${parentKey}/replyCount`,
      );

      return replyCountRef.set(admin.database.ServerValue.increment(1));
    };

    const incrementCount =
      parentType === ParentTypesE.article
        ? incrementCommentCount()
        : incrementReplyCount();

    return Promise.all([
      setCommentsByParent,
      setCommentsByAuthor,
      incrementCount,
    ]);
  });

export const onReplyCountUpdate = functions.database
  .ref('commentData/comments/{commentKey}/replyCount')
  .onUpdate(async (_, context) => {
    const { commentKey } = context.params;
    const parentCommentRef = adminDB.ref(`commentData/comments/${commentKey}`);
    const snap = await parentCommentRef.once('value').then();
    const comment = snap.val();
    const { parentType, parentKey } = comment as CommentI;

    // bubble up counts
    const incrementReplyCount = () => {
      const replyCountRef = adminDB.ref(
        `commentData/comments/${parentKey}/replyCount`,
      );

      return replyCountRef.set(admin.database.ServerValue.increment(1));
    };

    const incrementCommentCount = async () => {
      const articleRef = adminFS
        .collection('articleData')
        .doc('articles')
        .collection('articles')
        .doc(parentKey);
      await articleRef.update({
        commentCount: admin.firestore.FieldValue.increment(1),
      });

      return;
    };

    return parentType === ParentTypesE.article
      ? incrementCommentCount()
      : incrementReplyCount();
  });

export const onCommentVoteWrite = functions.database
  .ref(`commentData/votesByUser/{userId}/{commentKey}`)
  .onWrite(async (change, context) => {
    // track comment votes
    const before = change.before.val();
    const after = change.after.val();
    const diff = after - before;
    const commentKey = context.params['commentKey'];
    const commentRef = adminDB.ref(`commentData/comments/${commentKey}`);
    return commentRef.transaction(commentToUpdate => {
      if (!commentToUpdate) {
        return null;
      }
      const oldCount = commentToUpdate.voteCount || 0;
      const newCount = oldCount + diff;
      commentToUpdate.voteCount = newCount;
      return commentToUpdate;
    });
  });

export const onCommentDeletionTriggered = functions.database
  .ref('commentData/comments/{commentKey}/removedAt')
  .onCreate(async (snap, context) => {
    const commentKey = context.params.commentKey;
    const commentRef = snap.ref.parent;

    if (!commentRef || !commentRef.parent || !commentRef.parent.parent)
      throw new Error('one of the references is null or undefined');

    const archiveRef = commentRef.parent.parent.child(
      `commentArchive/${commentKey}`,
    );

    const commentSnap = await commentRef.once('value');

    return Promise.all([
      archiveRef.set(commentSnap.val()),
      commentRef.update({ text: 'This comment was removed.' }),
    ]);
  });
