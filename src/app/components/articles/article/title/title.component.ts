import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-title',
  templateUrl: './title.component.html',
  styleUrls: ['../article.component.scss', '../header-edit-sections.scss'],
})
export class TitleComponent {
  @Input() parentForm: FormGroup;
  @Input() isActive = false;
  @Input() title: string;

  @Output() onCtrlToggle = new EventEmitter();
  @Output() onClickOut = new EventEmitter();

  toggleCtrl = () => {
    this.onCtrlToggle.emit();
  };

  clickOut = () => {
    this.onClickOut.emit();
  };
}
