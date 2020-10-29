import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { HtmlInputEventI } from '@shared_models/index';

@Component({
  selector: 'cos-cover-image-edit',
  templateUrl: './cover-image-edit.component.html',
  styleUrls: ['./cover-image-edit.component.scss'],
})
export class CoverImageEditComponent {
  @Input() parentForm: FormGroup;
  @Output() onCoverImageSelected = new EventEmitter<File>();

  selectCoverImage = (e: HtmlInputEventI) =>
    this.onCoverImageSelected.emit(e.target.files[0]);
}
