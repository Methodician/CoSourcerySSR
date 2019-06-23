import { Component, OnInit, Input } from '@angular/core';
import { UserService } from '@services/user.service';
import { UserInfo } from '@models/classes/user-info';
import { Comment } from '@models/interfaces/comment';
@Component({
  selector: 'cos-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit {
  @Input() comment: Comment;
  @Input() isBeingEdited = false;

  authorInfo: UserInfo;
  constructor(private userSvc: UserService) {}

  ngOnInit() {
    this.initializeAuthor();
  }

  initializeAuthor = async () => {
    const snap = await this.userSvc
      .userRef(this.comment.authorId)
      .query.once('value');
    const author = snap.val();
    this.authorInfo = new UserInfo(author);
  };
}
