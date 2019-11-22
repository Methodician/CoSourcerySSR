import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommentService } from '@services/comment.service';
import { UserService } from '@services/user.service';
import { IComment, EVoteDirections, EParentTypes } from '@models/comment';
import { IKeyMap } from '@models/shared';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@services/auth.service';
@Component({
  selector: 'cos-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject();
  @Input() isUnderComment = true;
  @Input() parentKey: string;
  comments: Array<IComment>;
  votesMap: IKeyMap<EVoteDirections> = {};
  unfurlMap: IKeyMap<boolean> = {};

  constructor(
    private commentSvc: CommentService,
    private userSvc: UserService,
    private authSvc: AuthService
  ) {}

  commentState$ = this.commentSvc.commentState$;
  loggedInUser$ = this.userSvc.loggedInUser$;
  authInfo$ = this.authSvc.authInfo$;

  ngOnInit() {
    if (!this.parentKey) {
      throw new Error('CommentList cannot function without a parentKey input');
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
      this.authSvc.authInfo$.value.uid,
      parentKey,
      EParentTypes.comment
    )

  onAddComment = () => this.commentSvc.saveNewComment();

  onCancelComment = () => this.commentSvc.resetCommentState();

  onRemoveComment = (commentKey: string) =>
    this.commentSvc.removeComment(commentKey)

  onUpvoteComment = (commentKey: string) =>
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn) {
        this.commentSvc.upvoteComment(
          this.authSvc.authInfo$.value.uid,
          commentKey
        );
      }
    })

  onDownvoteComment = (commentKey: string) =>
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn) {
        this.commentSvc.downvoteComment(
          this.authSvc.authInfo$.value.uid,
          commentKey
        );
      }
    })

  onToggleUnfurl = (key: string) =>
    (this.unfurlMap[key] = this.unfurlMap[key] ? !this.unfurlMap[key] : true)

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
  }

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
  }

  wasVoteCast = (parentKey: string, direction: EVoteDirections) =>
    this.votesMap[parentKey] && this.votesMap[parentKey] === direction

  // scott: this should be checking authSvc.authInfo$.value instead
  // There are abunch of other places this may be happening too but this one should fix a lot
  isLoggedIn = () => !!this.authSvc.authInfo$.value.isLoggedIn();

  isCommentNew = () => {
    return this.commentState$.value.parentKey && !this.commentState$.value.key;
  }

  isCommentBeingEdited = (key: string) => this.commentState$.value.key === key;

  isChildBeingEdited = (key: string) =>
    this.commentState$.value.parentKey === key
}
