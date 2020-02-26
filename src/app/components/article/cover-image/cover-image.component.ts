import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-cover-image',
  templateUrl: './cover-image.component.html',
  styleUrls: ['./cover-image.component.scss'],
})
export class CoverImageComponent {
  @Input() isActive = false;
  @Input() imageUrl: string;
  @Input() imageAlt: string;
  @Input() parentForm: FormGroup;

  @Output() onCtrlToggle = new EventEmitter();
  @Output() onClickOut = new EventEmitter();
  @Output() onCoverImageSelected = new EventEmitter<File>();

  toggleCtrl = () => this.onCtrlToggle.emit();
  clickOut = () => this.onClickOut.emit();
  selectCoverImage = file => this.onCoverImageSelected.emit(file);
}
