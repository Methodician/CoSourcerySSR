import { Component, OnInit, Input } from '@angular/core';

import { Observable, combineLatest } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';

import { AuthService } from '@services/auth.service';
import { ArticleService } from '@services/article.service';
import { ArticlePreviewI } from '@shared_models/article.models';

@Component({
  selector: 'cos-preview-card-stats',
  templateUrl: './preview-card-stats.component.html',
  styleUrls: ['./preview-card-stats.component.scss'],
})
export class PreviewCardStatsComponent implements OnInit {
  @Input() articleData: ArticlePreviewI;
  isArticleBookmarked$: Observable<boolean>;

  constructor(
    private authSvc: AuthService,
    private articleSvc: ArticleService,
  ) {}

  ngOnInit() {
    this.watchArticleBookmark();
  }

  watchArticleBookmark = () => {
    this.isArticleBookmarked$ = this.authSvc.authInfo$.pipe(
      switchMap(info =>
        this.articleSvc
          .singleBookmarkRef(info.uid, this.articleData.articleId)
          .valueChanges(),
      ),
      map(bookmark => !!bookmark),
    );
  };

  onToggleBookmark = () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn) {
        combineLatest([this.authSvc.authInfo$, this.isArticleBookmarked$])
          .pipe(take(1))
          .subscribe(([authInfo, isBookmarked]) => {
            const { uid } = authInfo,
              { articleId } = this.articleData;
            if (isBookmarked) this.articleSvc.unBookmarkArticle(uid, articleId);
            else this.articleSvc.bookmarkArticle(uid, articleId);
          });
      }
    });
  };
}
