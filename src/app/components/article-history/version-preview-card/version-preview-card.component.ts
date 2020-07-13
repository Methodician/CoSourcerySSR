import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { map, switchMap } from 'rxjs/operators';

import { ArticleService } from '@services/article.service';
import { IVersionPreview } from '@models/article-info';
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
  ],
})
export class VersionPreviewCardComponent implements OnInit, OnDestroy {
  @Input() articleVersionData: IVersionPreview;
  coverImageUrl = '';
  isArticleBookmarked$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private articleSvc: ArticleService,
    private authSvc: AuthService,
    private storageSvc: StorageService,
  ) {}

  ngOnInit() {
    this.coverImageUrl = this.articleVersionData.imageUrl;
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
      .getImageUrl(
        `articleCoverThumbnails/${this.articleVersionData.articleId}`,
      )
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
          .singleBookmarkRef(info.uid, this.articleVersionData.articleId)
          .valueChanges(),
      ),
      map(bookmark => !!bookmark),
    );

  onToggleBookmark = () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn) {
        const uid = this.authSvc.authInfo$.value.uid,
          aid = this.articleVersionData.articleId,
          isbookmarked = this.isArticleBookmarked$.value;
        if (isbookmarked) {
          this.articleSvc.unBookmarkArticle(uid, aid);
        } else {
          this.articleSvc.bookmarkArticle(uid, aid);
        }
      }
    });
  };
}
