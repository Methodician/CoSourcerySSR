import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { map, switchMap, tap } from 'rxjs/operators';

import { ArticleService } from '@services/article.service';
import { ArticlePreview } from '@models/interfaces/article-info';
import { AuthService } from '@services/auth.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'cos-article-preview-card',
  templateUrl: './article-preview-card.component.html',
  styleUrls: ['./article-preview-card.component.scss'],
})
export class ArticlePreviewCardComponent implements OnInit, OnDestroy {
  @Input() articleData: ArticlePreview;
  isArticleBookmarked$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private articleSvc: ArticleService,
    private authSvc: AuthService
  ) {}

  ngOnInit() {
    this.isArticleBookmarked()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(val => {
        this.isArticleBookmarked$.next(val);
      });
    const url = this.articleData.imageUrl;
    if (url === 'unset') {
      this.articleSvc.setThumbnailImageUrl(this.articleData.articleId);
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  isValidUrl = (str: string) => {
    try {
      return Boolean(new URL(str));
    } catch (_) {
      return false;
    }
  };

  isArticleBookmarked = () =>
    this.authSvc.authInfo$.pipe(
      switchMap(info =>
        this.articleSvc
          .singleBookmarkRef(info.uid, this.articleData.articleId)
          .valueChanges()
      ),
      map(bookmark => !!bookmark)
    );

  onToggleBookmark = () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn) {
        const uid = this.authSvc.authInfo$.value.uid,
          aid = this.articleData.articleId,
          isBookemarked = this.isArticleBookmarked$.value;
        if (isBookemarked) {
          this.articleSvc.unBookmarkArticle(uid, aid);
        } else {
          this.articleSvc.bookmarkArticle(uid, aid);
        }
      }
    });
  };
}
