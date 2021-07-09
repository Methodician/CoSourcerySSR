import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { HtmlInputEventI } from '@shared_models/index';
import { setCoverImageFile } from '@store/article/article.actions';

@Component({
  selector: 'cos-cover-image-edit',
  templateUrl: './cover-image-edit.component.html',
  styleUrls: ['./cover-image-edit.component.scss'],
})
export class CoverImageEditComponent {
  @Input() parentForm: FormGroup;

  constructor(private store: Store) {}

  selectCoverImage = ($e: HtmlInputEventI) =>
    this.store.dispatch(
      setCoverImageFile({ coverImageFile: $e.target.files[0] }),
    );
}
