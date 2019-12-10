import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { map, switchMap } from 'rxjs/operators';

import { ArticleService } from '@services/article.service';
import { IArticlePreview } from '@models/article-info';
import { AuthService } from '@services/auth.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StorageService } from '@services/storage.service';

@Component({
  selector: 'cos-version-preview-card',
  templateUrl: './version-preview-card.component.html',
  styleUrls: [
    './version-preview-card.component.scss', 
    '../../shared/article-preview-card/article-preview-card.component.scss',
  ]
})
export class VersionPreviewCardComponent implements OnInit {
  @Input() articleData: IArticlePreview;
  coverImageUrl = '';
  isArticleBookmarked$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private articleSvc: ArticleService,
    private authSvc: AuthService,
    private storageSvc: StorageService
  ) {}

  ngOnInit() {
    this.watchCoverImageUrl();
    this.isArticleBookmarked()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(val => {
        this.isArticleBookmarked$.next(val);
      });
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
