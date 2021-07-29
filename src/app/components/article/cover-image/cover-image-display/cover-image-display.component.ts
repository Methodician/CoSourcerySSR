import { Component } from '@angular/core';
import {
  makeStateKey,
  SafeUrl,
  TransferState,
} from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { coverImageAlt, coverImageUri } from '@store/article/article.selectors';
import { combineLatest } from 'rxjs';
import { first, map, startWith, tap } from 'rxjs/operators';

const LOCAL_STATE_KEY =
  makeStateKey<{ imageAlt: string; imageUri: string | ArrayBuffer | SafeUrl }>(
    'coverImageDisplay',
  );
@Component({
  selector: 'cos-cover-image-display',
  templateUrl: './cover-image-display.component.html',
  styleUrls: ['./cover-image-display.component.scss'],
})
export class CoverImageDisplayComponent {
  imageUri$ = this.store.select(coverImageUri);
  imageAlt$ = this.store.select(coverImageAlt);

  constructor(private store: Store, private state: TransferState) {}

  // Testing out combining transfer state into single object.
  // Appears to be less verbose, but possibly more fragile.
  // Going forward likely best not to combine them without good reason.
  ssrCoverImageState$ = () => {
    const preExisting = this.state.get(LOCAL_STATE_KEY, {
      imageUri: 'assets/images/logo.svg',
      imageAlt: 'Cover Image',
    });

    return combineLatest([this.imageAlt$, this.imageUri$]).pipe(
      first(([imageAlt, imageUri]) => !!imageAlt && !!imageUri),
      map(([imageAlt, imageUri]) => ({ imageAlt, imageUri })),
      tap(combo => this.state.set(LOCAL_STATE_KEY, combo)),
      startWith(preExisting),
    );
  };
}
