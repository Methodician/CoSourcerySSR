import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { currentArticleIntro } from '@store/article/article.selectors';

@Component({
  selector: 'cos-intro-display',
  templateUrl: './intro-display.component.html',
  styleUrls: ['./intro-display.component.scss', '../intro.component.scss'],
})
export class IntroDisplayComponent {
  intro$ = this.store.select(currentArticleIntro);

  constructor(private store: Store) {}
}
