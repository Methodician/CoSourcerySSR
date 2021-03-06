import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireObject } from '@angular/fire/database';
import { switchMap, map } from 'rxjs/operators';
import { BehaviorSubject, combineLatest } from 'rxjs';

// Internal stuff
import { ParentTypesE, CommentI, VoteDirectionsE } from '@shared_models/index';

import { FirebaseService } from './firebase.service';

const NULL_COMMENT: CommentI = {
  authorId: null,
  parentKey: null,
  text: null,
  replyCount: null,
  parentType: null,
  voteCount: null,
};
@Injectable({
  providedIn: 'root',
})
export class CommentService {
  commentState$: BehaviorSubject<CommentI> = new BehaviorSubject(NULL_COMMENT);

  constructor(
    private afd: AngularFireDatabase,
    private fbSvc: FirebaseService,
  ) {}

  enterEditCommentMode = (comment: CommentI) =>
    this.commentState$.next({ ...comment });

  enterNewCommentMode = (
    authorId: string,
    parentKey: string,
    parentType: ParentTypesE,
  ) => {
    const newComment = this.createCommentStub(authorId, parentKey, parentType);
    this.commentState$.next(newComment);
  };

  saveNewComment = async (comment: CommentI) => {
    await this.createComment(comment);
    this.resetCommentState();
  };

  saveCommentEdits = async (comment: CommentI) => {
    await this.updateComment(comment);
    this.resetCommentState();
  };

  resetCommentState = () => {
    this.commentState$.next(NULL_COMMENT);
  };

  createCommentStub = (
    authorId: string,
    parentKey: string,
    parentType: ParentTypesE,
  ) => {
    const newComment: CommentI = {
      authorId,
      parentKey,
      text: '',
      replyCount: 0,
      parentType,
      voteCount: 0,
    };
    return newComment;
  };

  userVotesRef(userId: string) {
    return this.afd.list<VoteDirectionsE>(this.userVotesPath(userId));
  }

  getVoteRef(voterId: string, commentKey: string) {
    return this.afd.object<VoteDirectionsE>(
      `${this.userVotesPath(voterId)}/${commentKey}`,
    );
  }

  async getExistingVote(voteRef: AngularFireObject<VoteDirectionsE>) {
    const existingVoteSnap = await voteRef.query.once('value');
    return existingVoteSnap.val();
  }

  async upvoteComment(voterId: string, commentKey: string) {
    const voteRef = this.getVoteRef(voterId, commentKey);
    const oldVote = await this.getExistingVote(voteRef);
    if (oldVote && oldVote === VoteDirectionsE.up) {
      return voteRef.set(null);
    }
    return voteRef.set(VoteDirectionsE.up);
  }

  async downvoteComment(voterId: string, commentKey: string) {
    const voteRef = this.getVoteRef(voterId, commentKey);
    const oldVote = await this.getExistingVote(voteRef);
    if (oldVote && oldVote === VoteDirectionsE.down) {
      return voteRef.set(null);
    }
    return voteRef.set(VoteDirectionsE.down);
  }

  createComment = (comment: CommentI) =>
    this.afd.list('commentData/comments').push({
      ...comment,
      lastUpdated: this.fbSvc.rtServerTimestamp,
      timestamp: this.fbSvc.rtServerTimestamp,
    }).key;

  updateComment = (comment: CommentI) =>
    this.afd.object(this.singleCommentPath(comment.key)).update({
      lastUpdated: this.fbSvc.rtServerTimestamp,
      text: comment.text,
    });

  removeComment = (commentKey: string) =>
    this.afd
      .object(this.singleCommentPath(commentKey))
      .update({ removedAt: this.fbSvc.rtServerTimestamp });

  // May be deprecated in light of Firebase's caching...
  watchCommentsByParent = (parentKey: string) => {
    return this.watchCommentKeysByParent(parentKey).pipe(
      switchMap(keys => {
        const comments$ = keys.map(key =>
          this.watchCommentByKey(key)
            .snapshotChanges()
            .pipe(
              map(commentSnap => {
                const key = commentSnap.key;
                const val = commentSnap.payload.val();
                return { key, ...val };
              }),
            ),
        );
        return combineLatest(comments$);
      }),
    );
  };

  watchCommentKeysByParent = (parentKey: string) => {
    const commentList$ = this.afd
      .list(`commentData/commentsByParent/${parentKey}`)
      .snapshotChanges();
    return commentList$.pipe(map(keySnaps => keySnaps.map(snap => snap.key)));
  };

  watchCommentByKey(key: string): AngularFireObject<CommentI> {
    return this.afd.object(this.singleCommentPath(key));
  }

  // helpers etc
  singleCommentPath = key => `commentData/comments/${key}`;
  userVotesPath = uid => `commentData/votesByUser/${uid}`;
}
