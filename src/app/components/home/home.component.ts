import { Component, OnInit } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser'

import { ArticlePreview } from '@models/interfaces/article-info';
import { ArticleService } from '@services/article.service';

import { map } from 'rxjs/operators';

const ALL_ARTICLES_KEY = makeStateKey<ArticlePreview[]>('allArticles');

@Component({
  selector: 'cos-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  // allArticles: Observable<ArticlePreview[]>;
  allArticles: ArticlePreview[];

  constructor(private articleSvc: ArticleService, private state: TransferState) {}

  ngOnInit() {
      this.initializeArticles();
  }

  initializeArticles() {
    // this.latestArticles = this.articleSvc.latestArticlesRef().valueChanges();
    // this.allArticles = this.articleSvc.allArticlesRef().valueChanges();
    this.allArticles = this.state.get(ALL_ARTICLES_KEY, null as any);

    if(!this.allArticles) {
      this.articleSvc.allArticlesRef()
      .valueChanges()
      .pipe(map(articles => {
        return articles.map(art => {
          if(art.timestamp) art.timestamp = art.timestamp.toDate();
          if(art.lastUpdated) art.lastUpdated = art.lastUpdated.toDate();
          return art;
        })
      }))
      .subscribe(articles => {
        this.allArticles = articles;
        this.state.set(ALL_ARTICLES_KEY, articles);
      })
    }
  }
}
