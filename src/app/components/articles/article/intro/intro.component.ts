import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss', '../header-edit-sections.scss'],
})
export class IntroComponent {
  @Input() parentForm: FormGroup;
  @Input() isActive: boolean;
  @Input() introduction: string;

  @Output() onCtrlToggle = new EventEmitter();
  @Output() onClickOut = new EventEmitter();

  toggleCtrl = () => {
    this.onCtrlToggle.emit();
  };

  clickOut = () => {
    this.onClickOut.emit();
  };
}
