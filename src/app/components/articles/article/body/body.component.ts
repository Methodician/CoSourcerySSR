import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss'],
})
export class BodyComponent {
  @Input() isActive: boolean;
  @Input() body: string;

  @Output() onCtrlToggle = new EventEmitter();
  @Output() onClickOut = new EventEmitter();
  @Output() onBodyChange = new EventEmitter<string>();

  toggleCtrl = () => this.onCtrlToggle.emit();

  clickOut = () => this.onClickOut.emit();

  changeBody = body => this.onBodyChange.emit(body);
}
