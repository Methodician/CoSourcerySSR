import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-cover-image-edit',
  templateUrl: './cover-image-edit.component.html',
  styleUrls: ['./cover-image-edit.component.scss'],
})
export class CoverImageEditComponent {
  @Input() parentForm: FormGroup;
  @Output() onCoverImageSelected = new EventEmitter<File>();

  onSelectCoverImage = (e: HtmlInputEvent) =>
    this.onCoverImageSelected.emit(e.target.files[0]);
}

export interface HtmlInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}
