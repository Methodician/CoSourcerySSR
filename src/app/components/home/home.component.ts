import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { ArticlePreviewI } from '@shared_models/article.models';
import {
  ITabItem,
  ITabList,
} from '@components/home/filter-menu/filter-menu.component';

import { SeoService } from '@services/seo.service';

import { Store } from '@ngrx/store';
import {
  loadAllArticlePreviews,
  loadBookmarkedArticlePreviews,
  loadLatestArticlePreviews,
} from '@store/browse-articles/browse-articles.actions';
import {
  allPreviews,
  bookmarkedPreviews,
  latestPreviews,
} from '@store/browse-articles/browse-articles.selectors';
import { isLoggedIn } from '@store/auth/auth.selectors';
import { PlatformService } from '@services/platform.service';
import {
  makeStateKey,
  StateKey,
  TransferState,
} from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { first, startWith, tap } from 'rxjs/operators';

const ALL_ARTICLES_KEY =
  makeStateKey<ReadonlyArray<ArticlePreviewI>>('allArticles');
const LATEST_ARTICLES_KEY =
  makeStateKey<ReadonlyArray<ArticlePreviewI>>('latestArticles');

@Component({
  selector: 'cos-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  // TODO: Consider switch to static: false https://angular.io/guide/static-query-migration
  @ViewChild('filterMenu', { static: true }) filterMenu;

  filterTabs = [
    { name: 'Latest', selected: true },
    { name: 'All', selected: false },
  ];

  allArticles: ReadonlyArray<ArticlePreviewI>;
  latestArticles: ReadonlyArray<ArticlePreviewI>;
  bookmarkedArticles$: Observable<ReadonlyArray<ArticlePreviewI>>;

  constructor(
    private store: Store,
    private seoSvc: SeoService,
    private platformSvc: PlatformService,
    private state: TransferState,
  ) {
    this.initiatePreviewLoading();
    if (this.platformSvc.isBrowser && !this.haveAllPreviewsLoaded()) {
      this.dispatchPreviewLoaders();
    } else if (this.platformSvc.isServer) {
      this.dispatchPreviewLoaders();
    }
  }

  ngOnInit() {
    this.store.select(isLoggedIn).subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.store.dispatch(loadBookmarkedArticlePreviews());
        this.bookmarkedArticles$ = this.store.select(bookmarkedPreviews);
        this.addFilterTab({ name: 'Bookmarked', selected: false });
      }
    });
    this.seoSvc.generateTags({ canonicalUrl: 'https://cosourcery.com/home' });
  }

  ngOnDestroy() {}

  ssrArticleCollection = (
    articles$: Observable<ReadonlyArray<ArticlePreviewI>>,
    stateKey: StateKey<ReadonlyArray<ArticlePreviewI>>,
  ) => {
    const preExisting = this.state.get(stateKey, []);
    return articles$.pipe(
      first(articles => articles.length !== 0),
      tap(articles => this.state.set(stateKey, articles)),
      startWith(preExisting),
    );
  };

  initiatePreviewLoading = () => {
    this.ssrArticleCollection(
      this.store.select(allPreviews),
      ALL_ARTICLES_KEY,
    ).subscribe(articles => (this.allArticles = articles));

    this.ssrArticleCollection(
      this.store.select(latestPreviews),
      LATEST_ARTICLES_KEY,
    ).subscribe(articles => (this.latestArticles = articles));
  };

  dispatchPreviewLoaders = () => {
    this.store.dispatch(loadAllArticlePreviews());
    this.store.dispatch(loadLatestArticlePreviews());
  };

  haveAllPreviewsLoaded = () =>
    !!this.state.get(ALL_ARTICLES_KEY, null) &&
    !!this.state.get(LATEST_ARTICLES_KEY, null);

  // HOME FILTER FUNCTIONALITY
  addFilterTab = (tab: ITabItem) => {
    if (!this.filterMenu.getTabByName(tab.name)) {
      this.filterTabs.push(tab);
    }
  };

  onFilterTabAdded = ($event: ITabList) => {
    const lastTabIndex = $event.length - 1;
    const newestTabName = $event[lastTabIndex].name;
    if (newestTabName === 'Search Results') {
      this.filterMenu.selectTab(lastTabIndex);
    }
  };
  //end home filter functionality

  // HELPERS
  createPreviewLink = (article: ArticlePreviewI) => `/article/${article.slug}`;
  // end helpers
}
