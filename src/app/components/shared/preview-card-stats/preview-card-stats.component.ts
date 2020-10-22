import { Component, OnInit, Input, Inject, PLATFORM_ID } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { isPlatformServer } from '@angular/common';

import { Observable, combineLatest } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';

import { AuthService } from '@services/auth.service';
import { ArticleService } from '@services/article.service';
import { IArticlePreview } from '@models/article-info';

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
    @Inject(PLATFORM_ID) platformId: string,
  ) {
    const urlBase = isPlatformServer(platformId)
      ? `http://localhost:4200/`
      : '';
    const iconMap = {
      comment: 'assets/icons/comment.svg',
      edit: 'assets/icons/edit.svg',
      loyalty: 'assets/icons/loyalty.svg',
      bookmark: 'assets/icons/bookmark.svg',
    };

    Object.entries(iconMap).map(([name, path]) => {
      iconRegistry.addSvgIcon(
        name,
        sanitizer.bypassSecurityTrustResourceUrl(`${urlBase}${path}`),
      );
    });
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
