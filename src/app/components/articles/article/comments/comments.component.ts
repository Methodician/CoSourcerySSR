import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'cos-comments',
  templateUrl: './comments.component.html',
  styleUrls: [
    './comments.component.scss',
    './comment-list/comment-list.component.scss',
  ],
})
export class CommentsComponent implements OnInit {
  replyInfo;
  constructor() {}

  ngOnInit() {}
}
