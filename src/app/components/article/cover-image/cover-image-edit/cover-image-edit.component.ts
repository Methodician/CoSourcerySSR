import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { IHtmlInputEvent } from '@models/shared';

@Component({
  selector: 'cos-cover-image-edit',
  templateUrl: './cover-image-edit.component.html',
  styleUrls: ['./cover-image-edit.component.scss'],
})
export class CoverImageEditComponent {
  @Input() parentForm: FormGroup;
  @Output() onCoverImageSelected = new EventEmitter<File>();

  selectCoverImage = (e: IHtmlInputEvent) =>
    this.onCoverImageSelected.emit(e.target.files[0]);
}
