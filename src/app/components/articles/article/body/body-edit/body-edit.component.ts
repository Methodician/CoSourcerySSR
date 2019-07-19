import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import InlineEditor from '@ckeditor/ckeditor5-build-inline';

@Component({
  selector: 'cos-body-edit',
  templateUrl: './body-edit.component.html',
  styleUrls: ['./body-edit.component.scss'],
})
export class BodyEditComponent implements OnInit {
  @Input() body: string;

  @Output() onBodyChange = new EventEmitter<string>();

  constructor() {}

  ngOnInit() {
    console.log(this.body);
  }

  changeBody = body => this.onBodyChange.emit(body);
}
