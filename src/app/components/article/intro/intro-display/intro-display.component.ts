import { Component } from '@angular/core';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { currentArticleIntro } from '@store/article/article.selectors';
import { first, startWith, tap } from 'rxjs/operators';

const INTRO_KEY = makeStateKey<string>('intro');

@Component({
  selector: 'cos-intro-display',
  templateUrl: './intro-display.component.html',
  styleUrls: ['./intro-display.component.scss', '../intro.component.scss'],
})
export class IntroDisplayComponent {
  intro$ = this.store.select(currentArticleIntro);

  constructor(private store: Store, private state: TransferState) {}

  ssrIntro$ = () => {
    const preExisting = this.state.get(INTRO_KEY, null);

    return this.intro$.pipe(
      first(intro => !!intro),
      tap(intro => this.state.set(INTRO_KEY, intro)),
      startWith(preExisting),
    );
  };
}
