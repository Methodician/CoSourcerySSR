import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { BrowseArticlesEffects } from './browse-articles.effects';

describe('BrowseArticlesEffects', () => {
  let actions$: Observable<any>;
  let effects: BrowseArticlesEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BrowseArticlesEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.inject(BrowseArticlesEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
