import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommentService } from '@services/comment.service';
import { UserService } from '@services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { Comment } from '@models/interfaces/comment';

@Component({
  selector: 'cos-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
})
export class CommentListComponent implements OnInit, OnDestroy {
  @Input() isUnderComment = true;
  @Input() parentKey: string;

  // TODO: Make an object map a more global interface
  subscriptionMap: any = {};
  comments: Array<Comment>;

  constructor(
    private commentSvc: CommentService,
    private userSvc: UserService,
    private dialog: MatDialog
  ) {}

  commentState$ = this.commentSvc.commentState$;
  loggedInUser$ = this.userSvc.loggedInUser$;

  ngOnInit() {
    if (!this.parentKey) {
      throw 'CommentList cannot function without a parentKey input';
    }
    this.watchComments();
  }

  ngOnDestroy() {
    for (let key in this.subscriptionMap) {
      console.log('should destroy subscription:', key);
    }
  }

  watchComments = () => {
    const commentsSubscription = this.commentSvc
      .watchCommentsByParent(this.parentKey)
      .subscribe(comments => {
        this.comments = comments;
      });
    this.subscriptionMap.commentSub = commentsSubscription;
  };

  isCommentBeingEdited = (key: string) => {
    return (
      this.loggedInUser$.value.uid &&
      this.commentState$.value &&
      this.commentState$.value.parentKey === key
    );
  };
}
