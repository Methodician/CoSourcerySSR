import { Component, OnInit, ViewChild } from '@angular/core';
import {
  TransferState,
  makeStateKey,
  StateKey,
} from '@angular/platform-browser';

import { ArticlePreview } from '@models/interfaces/article-info';
import { ArticleService } from '@services/article.service';
import { TabItem, TabList } from './filter-menu/filter-menu.component';

import { Observable } from 'rxjs';
import { map, tap, startWith } from 'rxjs/operators';
import { AngularFirestoreCollection } from '@angular/fire/firestore';

const ALL_ARTICLES_KEY = makeStateKey<ArticlePreview[]>('allArticles');
const LATEST_ARTICLES_KEY = makeStateKey<ArticlePreview[]>('latestArticles');

@Component({
  selector: 'cos-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  @ViewChild('filterMenu') filterMenu;

  filterTabs = [
    { name: 'Latest', selected: true },
    { name: 'All', selected: false },
  ];

  allArticles$: Observable<ArticlePreview[]>;
  latestArticles$: Observable<ArticlePreview[]>;

  userId;

  constructor(
    private articleSvc: ArticleService,
    private state: TransferState
  ) {}

  ngOnInit() {
    this.initializeArticles();
  }

  initializeArticles = () => {
    this.latestArticles$ = this.ssrArticleCollection(
      this.articleSvc.latestArticlesRef(),
      LATEST_ARTICLES_KEY
    );

    this.allArticles$ = this.ssrArticleCollection(
      this.articleSvc.allArticlesRef(),
      ALL_ARTICLES_KEY
    );
  };

  ssrArticleCollection = (
    fsRef: AngularFirestoreCollection,
    stateKey: StateKey<ArticlePreview[]>
  ) => {
    const preExisting$ = this.state.get(stateKey, null as any);
    return fsRef.valueChanges().pipe(
      map(articles => {
        return articles.map(art => {
          if (art.timestamp) art.timestamp = art.timestamp.toDate();
          if (art.lastUpdated) art.lastUpdated = art.lastUpdated.toDate();
          return art;
        });
      }),
      tap(articles => this.state.set(stateKey, articles)),
      startWith(preExisting$)
    );
  };

  // HOME FILTER FUNCTIONALITY

  addFilterTab = (tab: TabItem) => {
    if (!this.filterMenu.getTabByName(tab.name)) {
      this.filterTabs.push(tab);
    }
  };

  onFilterTabAdded = ($event: TabList) => {
    const lastTabIndex = $event.length - 1;
    const newestTabName = $event[lastTabIndex].name;
    if (newestTabName === 'Search Results') {
      this.filterMenu.selectTab(lastTabIndex);
    }
  };
}
