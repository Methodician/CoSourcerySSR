import { Component } from '@angular/core';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { currentArticleTitle } from '@store/article/article.selectors';
import { first, startWith, tap } from 'rxjs/operators';

const TITLE_KEY = makeStateKey<string>('title');
@Component({
  selector: 'cos-title-display',
  templateUrl: './title-display.component.html',
  styleUrls: ['../title.component.scss'],
})
export class TitleDisplayComponent {
  title$ = this.store.select(currentArticleTitle);

  constructor(private store: Store, private state: TransferState) {}

  ssrTitle$ = () => {
    const preExisting = this.state.get(TITLE_KEY, null);

    return this.title$.pipe(
      first(title => !!title),
      tap(title => this.state.set(TITLE_KEY, title)),
      startWith(preExisting),
    );
  };
}
