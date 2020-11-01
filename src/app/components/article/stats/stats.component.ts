import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { isPlatformServer } from '@angular/common';

import { Observable, combineLatest } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';

import { ArticleService } from '@services/article.service';
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

  slugOrId = () => this.slug || this.articleId;
}
