import { Component, OnInit, ViewChild } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';

import { ArticlePreview } from '@models/interfaces/article-info';
import { ArticleService } from '@services/article.service';
import { TabItem, TabList } from './filter-menu/filter-menu.component';

import { map } from 'rxjs/operators';

const ALL_ARTICLES_KEY = makeStateKey<ArticlePreview[]>('allArticles');
const LATEST_ARTICLES_KEY = makeStateKey<ArticlePreview[]>('latestArticles');

@Component({
  selector: 'cos-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild('filterMenu') filterMenu;

  filterTabs = [
    { name: 'Latest', selected: true },
    { name: 'All', selected: false }
  ];

  allArticles: ArticlePreview[];
  latestArticles: ArticlePreview[];

  userId;

  constructor(
    private articleSvc: ArticleService,
    private state: TransferState
  ) {}

  ngOnInit() {
    this.initializeArticles();
  }

  initializeArticles = () => {
    this.latestArticles = this.state.get(LATEST_ARTICLES_KEY, null as any);
    this.allArticles = this.state.get(ALL_ARTICLES_KEY, null as any);

    if (!this.latestArticles) {
      this.articleSvc
        .latestArticlesRef()
        .valueChanges()
        .pipe(
          map(articles => {
            return articles.map(art => {
              if (art.timestamp) art.timestamp = art.timestamp.toDate();
              if (art.lastUpdated) art.lastUpdated = art.lastUpdated.toDate();
              return art;
            });
          })
        )
        .subscribe(articles => {
          this.latestArticles = articles;
          this.state.set(LATEST_ARTICLES_KEY, articles);
        });
    }

    if (!this.allArticles) {
      this.articleSvc
        .allArticlesRef()
        .valueChanges()
        .pipe(
          map(articles => {
            return articles.map(art => {
              if (art.timestamp) art.timestamp = art.timestamp.toDate();
              if (art.lastUpdated) art.lastUpdated = art.lastUpdated.toDate();
              return art;
            });
          })
        )
        .subscribe(articles => {
          this.allArticles = articles;
          this.state.set(ALL_ARTICLES_KEY, articles);
        });
    }
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
