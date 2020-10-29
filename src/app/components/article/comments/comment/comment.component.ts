import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { UserService } from '@services/user.service';
import { CUserInfo } from '@models/user-info';
import { CommentI } from '@shared_models/index';
import { Subscription } from 'rxjs';
@Component({
  selector: 'cos-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit, OnDestroy {
  @Input() comment: CommentI;
  @Input() isBeingEdited = false;

  authorSubscription: Subscription;

  authorInfo: CUserInfo;
  constructor(private userSvc: UserService) {}

  ngOnInit() {
    this.initializeAuthor();
  }

  ngOnDestroy() {
    this.authorSubscription.unsubscribe();
  }

  initializeAuthor = () => {
    this.authorSubscription = this.userSvc
      .userRef(this.comment.authorId)
      .valueChanges()
      .subscribe(user => {
        this.authorInfo = new CUserInfo(user);
      });
  };
}
