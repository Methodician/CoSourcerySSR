import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommentService } from '@services/comment.service';
import { UserService } from '@services/user.service';
import {
  Comment,
  VoteDirections,
  ParentTypes,
} from '@models/interfaces/comment';
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

  subscriptionMap: KeyMap<Subscription> = {};
  comments: Array<Comment>;
  votesMap: KeyMap<VoteDirections> = {};
  unfurlMap: KeyMap<boolean> = {};

  constructor(
    private commentSvc: CommentService,
    private userSvc: UserService,
    private authSvc: AuthService
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

  enterEditMode = comment => this.commentSvc.enterEditCommentMode(comment);

  enterNewCommentMode = parentKey =>
    this.commentSvc.enterNewCommentMode(
      this.loggedInUser$.value.uid,
      parentKey,
      ParentTypes.comment
    );

  onCancelComment = () => this.commentSvc.resetCommentState();

  onAddComment = () => this.commentSvc.saveNewComment();

  onSaveEdits = () => this.commentSvc.saveCommentEdits();

  onUpvoteComment = (commentKey: string) =>
    this.commentSvc.upvoteComment(this.loggedInUser$.value.uid, commentKey);

  onDownvoteComment = (commentKey: string) =>
    this.commentSvc.downvoteComment(this.loggedInUser$.value.uid, commentKey);

  onToggleUnfurl = (key: string) =>
    (this.unfurlMap[key] = this.unfurlMap[key] ? !this.unfurlMap[key] : true);

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
        this.votesMap = votesMap;
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
    this.votesMap[parentKey] && this.votesMap[parentKey] === direction;

  isLoggedIn = () => !!this.loggedInUser$.value.uid;

  isCommentNew = () => {
    // console.log(this.commentState$.value);
    return this.commentState$.value.parentKey && !this.commentState$.value.key;
  };

  isCommentBeingEdited = (key: string) => this.commentState$.value.key === key;

  isChildBeingEdited = (key: string) =>
    this.commentState$.value.parentKey === key;

  authCheck = () => this.authSvc.authCheck();
}
