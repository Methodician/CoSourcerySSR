import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireObject } from '@angular/fire/database';
import {
  Comment,
  ParentTypes,
  VoteDirections,
} from '@models/interfaces/comment';
import { rtServerTimestamp } from '../shared/helpers/firebase';
import { combineLatest } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  commentState = {
    replyParentKey: null,
    currentlyEditingKey: null,
  };

  constructor(private afd: AngularFireDatabase) {}

  createCommentStub(
    authorId: string,
    parentKey: string,
    parentType: ParentTypes
  ) {
    const newComment: Comment = {
      authorId: authorId,
      parentKey: parentKey,
      text: '',
      replyCount: 0,
      parentType: parentType,
      voteCount: 0,
    };
    return newComment;
  }

  getUserVotesRef(userId: string) {
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

  async createComment(comment: Comment) {
    const commentToSave = {
      authorId: comment.authorId,
      text: comment.text,
      parentKey: comment.parentKey,
      lastUpdated: rtServerTimestamp,
      timestamp: rtServerTimestamp,
      parentType: comment.parentType,
      replyCount: comment.replyCount,
      voteCount: comment.voteCount,
    };
    return this.afd.list('commentData/comments').push(commentToSave).key;
  }

  updateComment(comment: Comment, commentKey: string) {
    const commentToSave = {
      lastUpdated: rtServerTimestamp,
      text: comment.text,
    };
    return this.afd
      .object(this.singleCommentPath(commentKey))
      .update(commentToSave);
  }

  removeComment(commentKey) {
    return this.afd
      .object(this.singleCommentPath(commentKey))
      .update({ removedAt: rtServerTimestamp });
  }

  watchCommentsByParent = (parentKey: string) =>
    this.afd
      .list(`commentData/commentsByParent/${parentKey}`)
      .snapshotChanges()
      .pipe(
        combineLatest(snapshots =>
          snapshots.map(snapshot =>
            this.watchCommentByKey(snapshot.key).snapshotChanges()
          )
        )
      );

  watchCommentByKey(key: string): AngularFireObject<{}> {
    return this.afd.object(this.singleCommentPath(key));
  }

  async getUserInfo(uid): Promise<firebase.database.DataSnapshot> {
    if (uid) {
      return this.afd.object(`userInfo/open/${uid}`).query.once('value');
    }
    return null;
  }

  // helpers etc
  singleCommentPath = key => `commentData/comments/${key}`;
  userVotesPath = uid => `commentData/votesByUser/${uid}`;
}
