import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommentService } from '@services/comment.service';
import { UserService } from '@services/user.service';
import {
  Comment,
  VoteDirections,
  ParentTypes,
} from '@models/interfaces/comment';
import { KeyMap } from '@models/interfaces/article-info';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@services/auth.service';
@Component({
  selector: 'cos-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
})
export class CommentListComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject();
  @Input() isUnderComment = true;
  @Input() parentKey: string;
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
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  enterEditMode = comment => this.commentSvc.enterEditCommentMode(comment);

  onSaveEdits = () => this.commentSvc.saveCommentEdits();

  enterNewCommentMode = parentKey =>
    this.commentSvc.enterNewCommentMode(
      this.loggedInUser$.value.uid,
      parentKey,
      ParentTypes.comment
    );

  onAddComment = () => this.commentSvc.saveNewComment();

  onCancelComment = () => this.commentSvc.resetCommentState();

  onRemoveComment = (commentKey: string) =>
    this.commentSvc.removeComment(commentKey);

  onUpvoteComment = (commentKey: string) =>
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn)
        this.commentSvc.upvoteComment(this.loggedInUser$.value.uid, commentKey);
    });

  onDownvoteComment = (commentKey: string) =>
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn)
        this.commentSvc.downvoteComment(
          this.loggedInUser$.value.uid,
          commentKey
        );
    });

  onToggleUnfurl = (key: string) =>
    (this.unfurlMap[key] = this.unfurlMap[key] ? !this.unfurlMap[key] : true);

  watchUserVotes = () => {
    this.commentSvc
      .userVotesRef(this.loggedInUser$.value.uid)
      .snapshotChanges()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(votesSnap => {
        const votesMap = {};
        for (let vote of votesSnap) {
          // The vote key happens to be a commentKey
          votesMap[vote.key] = vote.payload.val();
        }
        this.votesMap = votesMap;
      });
  };

  watchComments = () => {
    this.commentSvc
      .watchCommentsByParent(this.parentKey)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(comments => {
        this.comments = comments;
      });
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
}
