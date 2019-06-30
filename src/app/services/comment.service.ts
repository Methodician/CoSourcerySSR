import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireObject } from '@angular/fire/database';
import {
  Comment,
  ParentTypes,
  VoteDirections,
} from '@models/interfaces/comment';
import { rtServerTimestamp } from '../shared/helpers/firebase';
import { switchMap, map } from 'rxjs/operators';
import { BehaviorSubject, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  NULL_COMMENT: Comment = {
    authorId: null,
    parentKey: null,
    text: null,
    replyCount: null,
    parentType: null,
    voteCount: null,
  };
  commentState$: BehaviorSubject<Comment> = new BehaviorSubject(
    this.NULL_COMMENT
  );

  constructor(private afd: AngularFireDatabase) {}

  enterEditCommentMode = (comment: Comment) =>
    this.commentState$.next({ ...comment });

  enterNewCommentMode = (
    authorId: string,
    parentKey: string,
    parentType: ParentTypes
  ) => {
    const newComment = this.createCommentStub(authorId, parentKey, parentType);
    this.commentState$.next(newComment);
  };

  saveNewComment = async () => {
    await this.createComment(this.commentState$.value);
    this.resetCommentState();
  };

  saveCommentEdits = async () => {
    await this.updateComment(this.commentState$.value);
    this.resetCommentState();
  };

  resetCommentState = () => {
    this.commentState$.next(this.NULL_COMMENT);
  };

  createCommentStub = (
    authorId: string,
    parentKey: string,
    parentType: ParentTypes
  ) => {
    const newComment: Comment = {
      authorId: authorId,
      parentKey: parentKey,
      text: '',
      replyCount: 0,
      parentType: parentType,
      voteCount: 0,
    };
    return newComment;
  };

  userVotesRef(userId: string) {
    return this.afd.list<VoteDirections>(this.userVotesPath(userId));
  }

  getVoteRef(voterId: string, commentKey: string) {
    return this.afd.object<VoteDirections>(
      `${this.userVotesPath(voterId)}/${commentKey}`
    );
  }

  async getExistingVote(voteRef: AngularFireObject<VoteDirections>) {
    const existingVoteSnap = await voteRef.query.once('value');
    return existingVoteSnap.val();
  }

  async upvoteComment(voterId: string, commentKey: string) {
    const voteRef = this.getVoteRef(voterId, commentKey);
    const oldVote = await this.getExistingVote(voteRef);
    if (oldVote && oldVote === VoteDirections.up) {
      return voteRef.set(null);
    }
    return voteRef.set(VoteDirections.up);
  }

  async downvoteComment(voterId: string, commentKey: string) {
    const voteRef = this.getVoteRef(voterId, commentKey);
    const oldVote = await this.getExistingVote(voteRef);
    if (oldVote && oldVote === VoteDirections.down) {
      return voteRef.set(null);
    }
    return voteRef.set(VoteDirections.down);
  }

  createComment = (comment: Comment) =>
    this.afd.list('commentData/comments').push({
      ...comment,
      lastUpdated: rtServerTimestamp,
      timestamp: rtServerTimestamp,
    }).key;

  updateComment = (comment: Comment) =>
    this.afd.object(this.singleCommentPath(comment.key)).update({
      lastUpdated: rtServerTimestamp,
      text: comment.text,
    });

  removeComment = (commentKey: string) =>
    this.afd
      .object(this.singleCommentPath(commentKey))
      .update({ removedAt: rtServerTimestamp });

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
              })
            )
        );
        return combineLatest(comments$);
      })
    );
  };

  watchCommentKeysByParent = (parentKey: string) => {
    const commentList$ = this.afd
      .list(`commentData/commentsByParent/${parentKey}`)
      .snapshotChanges();
    return commentList$.pipe(map(keySnaps => keySnaps.map(snap => snap.key)));
  };

  watchCommentByKey(key: string): AngularFireObject<Comment> {
    return this.afd.object(this.singleCommentPath(key));
  }

  // helpers etc
  singleCommentPath = key => `commentData/comments/${key}`;
  userVotesPath = uid => `commentData/votesByUser/${uid}`;
}
