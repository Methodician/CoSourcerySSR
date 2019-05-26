import { Component, OnInit } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser'

import { Observable } from 'rxjs';
import { ArticlePreview } from '@models/interfaces/article-info';
import { ArticleService } from '@services/article.service';

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
      .subscribe(articles => {
        this.allArticles = articles;
        this.state.set(ALL_ARTICLES_KEY, articles);
      })
    }
  }
}
