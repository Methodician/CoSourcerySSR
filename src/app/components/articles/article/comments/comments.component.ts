import { Component, OnInit, Input } from '@angular/core';
import { CommentService } from '@services/comment.service';
import { UserService } from '@services/user.service';
import { ParentTypes, Comment } from '@models/interfaces/comment';
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
  @Input() isArticleNew: boolean;

  constructor(
    private commentSvc: CommentService,
    private userSvc: UserService,
    private authSvc: AuthService
  ) {}

  commentState$ = this.commentSvc.commentState$;
  loggedInUser$ = this.userSvc.loggedInUser$;

  ngOnInit() {}

  enterNewCommentMode = () => {
    this.commentSvc.enterNewCommentMode(
      this.loggedInUser$.value.uid,
      this.articleId,
      ParentTypes.article
    );
  };

  saveNewComment = (comment: Comment) => {
    this.commentSvc.saveNewComment(comment);
  };

  // Helpers etc
  authCheck = async () => {
    return await this.authSvc.authCheck();
  };

  isTopLevelCommentBeingCreated = () => {
    return (
      this.loggedInUser$.value.uid &&
      this.commentState$.value &&
      this.commentState$.value.parentKey === this.articleId
    );
  };
}
