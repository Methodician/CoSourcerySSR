import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { currentArticleTitle } from '@store/article/article.selectors';

@Component({
  selector: 'cos-title-display',
  templateUrl: './title-display.component.html',
  styleUrls: ['../title.component.scss'],
})
export class TitleDisplayComponent {
  title$ = this.store.select(currentArticleTitle);

  constructor(private store: Store) {}
}
