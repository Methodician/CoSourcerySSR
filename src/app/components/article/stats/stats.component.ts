import { Component, Input, OnInit } from '@angular/core';
import { ArticleService } from '@services/article.service';
import { Observable, combineLatest } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'cos-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
})
export class StatsComponent implements OnInit {
  @Input() commentCount: number;
  @Input() editCount: number;
  @Input() tagsCount: number;
  @Input() articleId: string;
  @Input() isArticleNew: boolean;
  @Input() slug: string;

  isBookmarked$: Observable<boolean>;

  constructor(
    private authSvc: AuthService,
    private articleSvc: ArticleService,
  ) {}
  ngOnInit() {
    this.watchArticleBookmark();
  }

  onBookmarkClicked = () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn) this.toggleBookmark();
    });
  };

  watchArticleBookmark = () => {
    this.isBookmarked$ = this.authSvc.authInfo$
      .pipe(
        switchMap(user =>
          this.articleSvc
            .singleBookmarkRef(user.uid, this.articleId)
            .valueChanges(),
        ),
      )
      .pipe(map(timestamp => !!timestamp));
  };

  toggleBookmark = () => {
    combineLatest([this.isBookmarked$, this.authSvc.authInfo$])
      .pipe(take(1))
      .subscribe(([isBookmarked, authInfo]) => {
        const { uid } = authInfo,
          { articleId } = this;
        if (isBookmarked) this.articleSvc.unBookmarkArticle(uid, articleId);
        else this.articleSvc.bookmarkArticle(uid, articleId);
      });
  };
}
