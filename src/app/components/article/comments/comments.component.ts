import { Component, OnInit, Input } from '@angular/core';
import { CommentService } from '@services/comment.service';
import { UserService } from '@services/user.service';
import { EParentTypes, IComment } from '@models/comment';
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
    private authSvc: AuthService
  ) {}

  commentState$ = this.commentSvc.commentState$;
  loggedInUser$ = this.userSvc.loggedInUser$;

  ngOnInit() {}

  enterNewCommentMode = () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn)
        this.commentSvc.enterNewCommentMode(
          this.loggedInUser$.value.uid,
          this.articleId,
          EParentTypes.article
        );
    });
  };

  onCancelComment = () => this.commentSvc.resetCommentState();

  saveNewComment = () => this.commentSvc.saveNewComment();

  // Helpers etc
  isTopLevelCommentBeingCreated = () => {
    return (
      this.loggedInUser$.value.uid &&
      this.commentState$.value.parentKey === this.articleId &&
      !this.commentState$.value.key
    );
  };
}
