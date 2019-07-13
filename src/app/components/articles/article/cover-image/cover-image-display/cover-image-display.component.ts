import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'cos-cover-image-display',
  templateUrl: './cover-image-display.component.html',
  styleUrls: ['./cover-image-display.component.scss'],
})
export class CoverImageDisplayComponent implements OnInit {
  @Input() imageUrl;
  @Input() imageAlt;

  _imageUrl = 'assets/images/logo.svg';
  _imageAlt = 'Cover Image';

  constructor() {}

  ngOnInit() {
    if (this.imageUrl) this._imageUrl = this.imageUrl;
    if (this.imageAlt) this._imageAlt = this.imageAlt;
  }
}
