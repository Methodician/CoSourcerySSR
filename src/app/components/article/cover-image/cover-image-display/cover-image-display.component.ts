import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { coverImageAlt, coverImageUri } from '@store/article/article.selectors';

@Component({
  selector: 'cos-cover-image-display',
  templateUrl: './cover-image-display.component.html',
  styleUrls: ['./cover-image-display.component.scss'],
})
export class CoverImageDisplayComponent {
  imageUri$ = this.store.select(coverImageUri);
  imageAlt$ = this.store.select(coverImageAlt);

  constructor(private store: Store) {}
}
