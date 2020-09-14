import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import {
  TransferState,
  makeStateKey,
  StateKey,
} from '@angular/platform-browser';

import { IArticlePreview } from '@models/article-info';
import {
  ITabItem,
  ITabList,
} from '@components/home/filter-menu/filter-menu.component';

import { ArticleService } from '@services/article.service';
import { SeoService } from '@services/seo.service';

import { Observable, Subject } from 'rxjs';
import { map, tap, startWith, takeUntil } from 'rxjs/operators';
import { AuthService } from '@services/auth.service';

const ALL_ARTICLES_KEY = makeStateKey<Observable<IArticlePreview[]>>(
  'allArticles',
);
const LATEST_ARTICLES_KEY = makeStateKey<Observable<IArticlePreview[]>>(
  'latestArticles',
);

@Component({
  selector: 'cos-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  // TODO: Consider switch to static: false https://angular.io/guide/static-query-migration
  @ViewChild('filterMenu', { static: true }) filterMenu;
  private unsubscribe: Subject<void> = new Subject();

  filterTabs = [
    { name: 'Latest', selected: true },
    { name: 'All', selected: false },
  ];

  allArticles$: Observable<IArticlePreview[]>;
  latestArticles$: Observable<IArticlePreview[]>;
  bookmarkedArticles$: Observable<IArticlePreview[]>;

  constructor(
    private articleSvc: ArticleService,
    private seoSvc: SeoService,
    private authSvc: AuthService,
    private state: TransferState,
  ) {}

  ngOnInit() {
    this.initializeArticles();
    this.seoSvc.generateTags({ canonicalUrl: 'https://cosourcery.com/home' });
    this.watchAuthInfo();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.clearArticleKeys();
  }

  // AUTH STUFF
  watchAuthInfo = () => {
    this.authSvc.authInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(({ uid }) => {
        if (uid) {
          this.watchBookmarkedArticles(uid);
          this.addFilterTab({ name: 'Bookmarked', selected: false });
        }
      });
  };
  //end auth stuff

  // ARTICLE STUFF
  initializeArticles = () => {
    this.latestArticles$ = this.ssrArticleCollection(
      this.articleSvc.latestArticlesRef().valueChanges(),
      LATEST_ARTICLES_KEY,
    );

    this.allArticles$ = this.ssrArticleCollection(
      this.articleSvc.allArticlesRef().valueChanges(),
      ALL_ARTICLES_KEY,
    );
  };

  clearArticleKeys = () => {
    this.state.set(ALL_ARTICLES_KEY, null);
    this.state.set(LATEST_ARTICLES_KEY, null);
  };

  watchBookmarkedArticles = (uid: string) => {
    this.bookmarkedArticles$ = this.articleSvc
      .watchBookmarkedArticles(uid)
      .pipe(
        map(articles =>
          articles.map(art => this.articleSvc.processArticleTimestamps(art)),
        ),
      );
  };

  ssrArticleCollection = (
    articles$: Observable<IArticlePreview[]>,
    stateKey: StateKey<Observable<IArticlePreview[]>>,
  ) => {
    const preExisting$ = this.state.get(stateKey, null as any);
    return articles$.pipe(
      map(articles =>
        articles.map(art => this.articleSvc.processArticleTimestamps(art)),
      ),
      tap(articles => this.state.set(stateKey, articles)),
      startWith(preExisting$),
    );
  };

  //end article stuff

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
  createPreviewLink = (article: IArticlePreview) => `/article/${article.slug}`;
  // end helpers
}
