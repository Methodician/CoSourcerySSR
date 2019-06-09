import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
})
export class IntroComponent {
  @Input() parentForm: FormGroup;
  @Input() isActive: boolean;
  @Input() introduction: string;

  @Output() onCtrlToggle = new EventEmitter();

  toggleCtrl = () => {
    this.onCtrlToggle.emit();
  };
}
