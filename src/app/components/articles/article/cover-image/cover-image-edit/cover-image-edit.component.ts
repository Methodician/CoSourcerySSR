import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cos-cover-image-edit',
  templateUrl: './cover-image-edit.component.html',
  styleUrls: ['./cover-image-edit.component.scss'],
})
export class CoverImageEditComponent implements OnInit {
  @Input() parentForm: FormGroup;
  imageUrl: string | ArrayBuffer;
  constructor() {}

  ngOnInit() {}

  onSelectCoverImage = (e: HtmlInputEvent) => {
    const reader = new FileReader();
    reader.onload = () => {
      this.imageUrl = reader.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  };
}

export interface HtmlInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}
