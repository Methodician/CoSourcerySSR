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

  allArticles$ = this.store.select(allPreviews);
  latestArticles$ = this.store.select(latestPreviews);
  bookmarkedArticles$ = this.store.select(bookmarkedPreviews);

  constructor(private store: Store, private seoSvc: SeoService) {}

  ngOnInit() {
    this.store.dispatch(loadAllArticlePreviews());
    this.store.dispatch(loadLatestArticlePreviews());
    this.store.dispatch(loadBookmarkedArticlePreviews());
    this.store
      .select(isLoggedIn)
      .subscribe(isLoggedIn =>
        isLoggedIn
          ? this.addFilterTab({ name: 'Bookmarked', selected: false })
          : null,
      );
    this.seoSvc.generateTags({ canonicalUrl: 'https://cosourcery.com/home' });
  }

  ngOnDestroy() {}

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
