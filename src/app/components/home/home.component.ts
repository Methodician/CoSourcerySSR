import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ArticlePreview } from '@class/article-info';
import { ArticleService } from '@services/article.service';

@Component({
  selector: 'cos-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  allArticles: Observable<ArticlePreview[]>;

  constructor(private articleSvc: ArticleService) {}

  ngOnInit() {
    this.initializeArticles();
  }

  initializeArticles() {
    // this.latestArticles = this.articleSvc.latestArticlesRef().valueChanges();
    this.allArticles = this.articleSvc.allArticlesRef().valueChanges();
  }
}
