import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss'],
})
export class BodyComponent {
  @Input() parentForm: FormGroup;
  @Input() isActive: boolean;
  @Input() body: string;
  @Input() isLoggedIn: boolean;

  @Output() onCtrlToggle = new EventEmitter();
  @Output() onClickOut = new EventEmitter();

  toggleCtrl = () => {
    this.onCtrlToggle.emit();
  };

  clickOut = () => {
    this.onClickOut.emit();
  };
}
