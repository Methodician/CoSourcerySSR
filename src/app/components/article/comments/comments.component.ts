import { Component, OnInit, Input } from '@angular/core';
import { CommentService } from '@services/comment.service';
import { UserService } from '@services/user.service';
import { CommentI, ParentTypesE } from '@shared_models/index';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'cos-comments',
  templateUrl: './comments.component.html',
  styleUrls: [
    './comments.component.scss',
    './comment-list/comment-list.component.scss',
  ],
})
export class CommentsComponent implements OnInit {
  @Input() articleId: string;

  constructor(
    private commentSvc: CommentService,
    private userSvc: UserService,
    private authSvc: AuthService,
  ) {}

  commentState: CommentI;
  loggedInUser$ = this.userSvc.loggedInUser$;

  ngOnInit() {
    this.commentSvc.commentState$.subscribe(
      comment => (this.commentState = comment),
    );
  }

  enterNewCommentMode = () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn)
        this.commentSvc.enterNewCommentMode(
          this.authSvc.authInfo$.value.uid,
          this.articleId,
          ParentTypesE.article,
        );
    });
  };

  onCancelComment = () => this.commentSvc.resetCommentState();

  saveNewComment = () => this.commentSvc.saveNewComment(this.commentState);

  // Helpers etc
  isTopLevelCommentBeingCreated = () => {
    return (
      this.authSvc.authInfo$.value.uid &&
      this.commentState.parentKey === this.articleId &&
      !this.commentState.key
    );
  };
}
