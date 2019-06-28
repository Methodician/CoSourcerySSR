import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommentService } from '@services/comment.service';
import { UserService } from '@services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { Comment, VoteDirections } from '@models/interfaces/comment';
import { tap } from 'rxjs/operators';
import { KeyMap } from '@models/interfaces/article-info';
import { Subscription } from 'rxjs';
import { AuthService } from '@services/auth.service';
@Component({
  selector: 'cos-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
})
export class CommentListComponent implements OnInit, OnDestroy {
  @Input() isUnderComment = true;
  @Input() parentKey: string;

  // TODO: Make an object map a more global interface
  subscriptionMap: KeyMap<Subscription> = {};
  comments: Array<Comment>;
  // TODO: Make KeyMap a shared interface
  userVotesMap: KeyMap<VoteDirections> = {};

  constructor(
    private commentSvc: CommentService,
    private userSvc: UserService,
    private authSvc: AuthService,
    private dialog: MatDialog
  ) {}

  commentState$ = this.commentSvc.commentState$;
  loggedInUser$ = this.userSvc.loggedInUser$;

  ngOnInit() {
    if (!this.parentKey) {
      throw 'CommentList cannot function without a parentKey input';
    }
    this.watchComments();
    this.watchUserVotes();
  }

  ngOnDestroy() {
    for (let key in this.subscriptionMap) {
      console.log('should destroy subscription:', key);
    }
  }

  onUpvoteComment = (commentKey: string) =>
    this.commentSvc.upvoteComment(this.loggedInUser$.value.uid, commentKey);

  onDownvoteComment = (commentKey: string) =>
    this.commentSvc.downvoteComment(this.loggedInUser$.value.uid, commentKey);

  watchUserVotes = () => {
    const userVotesSub = this.commentSvc
      .userVotesRef(this.loggedInUser$.value.uid)
      .snapshotChanges()
      .subscribe(votesSnap => {
        const votesMap = {};
        for (let vote of votesSnap) {
          // The vote key happens to be a commentKey
          votesMap[vote.key] = vote.payload.val();
        }
        this.userVotesMap = votesMap;
      });
    this.subscriptionMap.userVotes = userVotesSub;
  };

  watchComments = () => {
    const commentsSubscription = this.commentSvc
      .watchCommentsByParent(this.parentKey)
      .subscribe(comments => {
        this.comments = comments;
      });
    this.subscriptionMap.comments = commentsSubscription;
  };

  wasVoteCast = (parentKey: string, direction: VoteDirections) =>
    this.userVotesMap[parentKey] && this.userVotesMap[parentKey] === direction;

  isCommentBeingEdited = (key: string) =>
    this.loggedInUser$.value.uid &&
    this.commentState$.value &&
    this.commentState$.value.parentKey === key;

  authCheck = () => this.authSvc.authCheck();
}
