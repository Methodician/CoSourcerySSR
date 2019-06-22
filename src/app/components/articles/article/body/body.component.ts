import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss'],
})
export class BodyComponent implements OnInit {
  @Input() parentForm: FormGroup;
  @Input() isActive: boolean;
  @Input() body: string;
  @Input() isLoggedIn: boolean;

  @Output() onCtrlToggle = new EventEmitter();
  @Output() onClickOut = new EventEmitter();

  constructor() {
    const { parentForm, isActive, body, onCtrlToggle, onClickOut } = this;
    console.log({
      parentForm,
      isActive,
      body,
      onCtrlToggle,
      onClickOut,
    });
  }

  ngOnInit() {
    const { parentForm, isActive, body, onCtrlToggle, onClickOut } = this;
    console.log({
      parentForm,
      isActive,
      body,
      onCtrlToggle,
      onClickOut,
    });
  }
}
