import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';

@Component({
  selector: 'cos-cover-image-display',
  templateUrl: './cover-image-display.component.html',
  styleUrls: ['./cover-image-display.component.scss'],
})
export class CoverImageDisplayComponent {
  @Input() imageUrl;
  @Input() imageAlt;
  @Input() articleId: string;

  @ViewChild('coverImage', { static: false }) coverImage;

  _imageUrl = 'assets/images/logo.svg';
  _imageAlt = 'Cover Image';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.imageUrl || changes.imageAlt) {
      if (this.imageUrl) this._imageUrl = this.imageUrl;
      if (this.imageAlt) this._imageAlt = this.imageAlt;
    }
  }
}
