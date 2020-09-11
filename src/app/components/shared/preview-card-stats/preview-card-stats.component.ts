import { Component, OnInit, Input } from '@angular/core';
import { IArticlePreview } from '@models/article-info';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, combineLatest } from 'rxjs';
import { AuthService } from '@services/auth.service';
import { ArticleService } from '@services/article.service';
import { switchMap, map, take } from 'rxjs/operators';

@Component({
  selector: 'cos-preview-card-stats',
  templateUrl: './preview-card-stats.component.html',
  styleUrls: ['./preview-card-stats.component.scss'],
})
export class PreviewCardStatsComponent implements OnInit {
  @Input() articleData: IArticlePreview;
  isArticleBookmarked$: Observable<boolean>;

  constructor(
    private authSvc: AuthService,
    private articleSvc: ArticleService,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
  ) {
    iconRegistry.addSvgIcon(
      'comment',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/comment.svg'),
    );
    iconRegistry.addSvgIcon(
      'edit',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/edit.svg'),
    );
    iconRegistry.addSvgIcon(
      'loyalty',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/loyalty.svg'),
    );
    iconRegistry.addSvgIcon(
      'bookmark',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/bookmark.svg'),
    );
  }

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
