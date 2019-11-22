import * as functions from 'firebase-functions';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const trackCommentDeletions = functions.database.ref('commentData/comments/{commentKey}/removedAt').onCreate(async (snap, context) => {
  const commentKey = context.params.commentKey;
  const commentRef = snap.ref.parent;

  if(!commentRef || !commentRef.parent || !commentRef.parent.parent) throw new Error("one of the references is null or undefined")

  const archiveRef = commentRef.parent.parent.child(`commentArchive/${commentKey}`);
  const commentSnap = await commentRef.once('value').then();
  return Promise.all([
      archiveRef.set(commentSnap.val()),
      commentRef.update({ text: 'This comment was removed.' })
  ]);
})
