import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { map, switchMap, take } from 'rxjs/operators';
import { ArticleService } from '@services/article.service';
import { IArticlePreview } from '@models/article-info';
import { AuthService } from '@services/auth.service';
import { Subject, combineLatest, Observable } from 'rxjs';
import { StorageService } from '@services/storage.service';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

@Component({
  selector: 'cos-article-preview-card',
  templateUrl: './article-preview-card.component.html',
  styleUrls: ['./article-preview-card.component.scss'],
})
export class ArticlePreviewCardComponent implements OnInit, OnDestroy {
  @Input() linkTo: string;
  @Input() articleData: IArticlePreview;
  coverImageUrl = '';
  isArticleBookmarked$: Observable<boolean>;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private articleSvc: ArticleService,
    private authSvc: AuthService,
    private storageSvc: StorageService,
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
    this.watchCoverImageUrl();
    this.watchArticleBookmark();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  watchCoverImageUrl = () => {
    this.storageSvc
      .getImageUrl(`articleCoverThumbnails/${this.articleData.articleId}`)
      .subscribe(url => {
        this.coverImageUrl = url;
      });
  };

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

  isArticleBookmarked = () =>
    this.authSvc.authInfo$.pipe(
      switchMap(info =>
        this.articleSvc
          .singleBookmarkRef(info.uid, this.articleData.articleId)
          .valueChanges(),
      ),
      map(bookmark => !!bookmark),
    );

  onToggleBookmark = () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn) {
        combineLatest([this.authSvc.authInfo$, this.isArticleBookmarked$])
          .pipe(take(1))
          .subscribe(([loggedInUser, isBookmarked]) => {
            const { uid } = loggedInUser,
              { articleId } = this.articleData;
            if (isBookmarked) this.articleSvc.unBookmarkArticle(uid, articleId);
            else this.articleSvc.bookmarkArticle(uid, articleId);
          });
      }
    });
  };
}
