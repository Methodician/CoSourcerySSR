import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommentService } from '@services/comment.service';
import { UserService } from '@services/user.service';
import { CommentI, VoteDirectionsE, ParentTypesE } from '@shared_models/index';
import { KeyMapI } from '@shared_models/index';
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
  comments: Array<CommentI>;
  votesMap: KeyMapI<VoteDirectionsE> = {};
  unfurlMap: KeyMapI<boolean> = {};

  constructor(
    private commentSvc: CommentService,
    private userSvc: UserService,
    private authSvc: AuthService,
  ) {}

  commentState: CommentI;
  loggedInUser$ = this.userSvc.loggedInUser$;
  authInfo$ = this.authSvc.authInfo$;

  ngOnInit() {
    if (!this.parentKey) {
      throw new Error('CommentList cannot function without a parentKey input');
    }
    this.commentSvc.commentState$.subscribe(
      comment => (this.commentState = comment),
    );
    this.watchComments();
    this.watchUserVotes();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  enterEditMode = comment => this.commentSvc.enterEditCommentMode(comment);

  onSaveEdits = () => this.commentSvc.saveCommentEdits(this.commentState);

  enterNewCommentMode = parentKey => {
    this.unfurlMap[parentKey] = true;

    return this.commentSvc.enterNewCommentMode(
      this.authSvc.authInfo$.value.uid,
      parentKey,
      ParentTypesE.comment,
    );
  };

  onAddComment = () => this.commentSvc.saveNewComment(this.commentState);

  onCancelComment = () => this.commentSvc.resetCommentState();

  onRemoveComment = (commentKey: string) =>
    this.commentSvc.removeComment(commentKey);

  onUpvoteComment = (commentKey: string) =>
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn) {
        this.commentSvc.upvoteComment(
          this.authSvc.authInfo$.value.uid,
          commentKey,
        );
      }
    });

  onDownvoteComment = (commentKey: string) =>
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn) {
        this.commentSvc.downvoteComment(
          this.authSvc.authInfo$.value.uid,
          commentKey,
        );
      }
    });

  onToggleUnfurl = (key: string) =>
    (this.unfurlMap[key] = this.unfurlMap[key] ? !this.unfurlMap[key] : true);

  watchUserVotes = () => {
    this.commentSvc
      .userVotesRef(this.authSvc.authInfo$.value.uid)
      .snapshotChanges()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(votesSnap => {
        const votesMap = {};
        for (const vote of votesSnap) {
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
        if (!this.isUnderComment) {
          this.comments = comments.reverse();
        } else {
          this.comments = comments;
        }
      });
  };

  wasVoteCast = (parentKey: string, direction: VoteDirectionsE) =>
    this.votesMap[parentKey] && this.votesMap[parentKey] === direction;

  isLoggedIn = () => !!this.authSvc.authInfo$.value.isLoggedIn();

  isCommentNew = () =>
    !!this.commentState &&
    this.commentState.parentKey &&
    !this.commentState.key;

  isCommentBeingEdited = (key: string) =>
    !!this.commentState && this.commentState.key === key;

  isChildBeingEdited = (key: string) =>
    !!this.commentState && this.commentState.parentKey === key;

  trackCommentsBy = (_, comment: CommentI) => comment.key;
}
