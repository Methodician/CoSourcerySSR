import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { ArticlePreview } from '@models/interfaces/article-info';
import { ArticleService } from '@services/article.service';

@Component({
  selector: 'cos-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  allArticles: Observable<ArticlePreview[]>;

  constructor(@Inject(PLATFORM_ID) private platform: Object, private articleSvc: ArticleService) {}

  ngOnInit() {
    if(isPlatformBrowser(this.platform)){

      this.initializeArticles();
    }
  }

  initializeArticles() {
    // this.latestArticles = this.articleSvc.latestArticlesRef().valueChanges();
    this.allArticles = this.articleSvc.allArticlesRef().valueChanges();
  }
}
