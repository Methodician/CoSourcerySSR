import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-title',
  templateUrl: './title.component.html',
  styleUrls: ['../article.component.scss'],
})
export class TitleComponent {
  @Input() parentForm: FormGroup;
  @Input() isActive: boolean;
  @Input() title: string;

  @Output() onCtrlToggle = new EventEmitter();

  toggleCtrl = () => {
    this.onCtrlToggle.emit();
  };
}
