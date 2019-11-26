import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { map, switchMap } from 'rxjs/operators';

import { ArticleService } from '@services/article.service';
import { IArticlePreview } from '@models/article-info';
import { AuthService } from '@services/auth.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StorageService } from '@services/storage.service';

@Component({
  selector: 'cos-article-preview-card',
  templateUrl: './article-preview-card.component.html',
  styleUrls: ['./article-preview-card.component.scss'],
})
export class ArticlePreviewCardComponent implements OnInit, OnDestroy {
  @Input() articleData: IArticlePreview;
  @Input() routeLink = '';
  coverImageUrl = '';
  isArticleBookmarked$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private articleSvc: ArticleService,
    private authSvc: AuthService,
    private route: ActivatedRoute,
    private storageSvc: StorageService
  ) {}

  ngOnInit() {
    this.watchCoverImageUrl();
    this.isArticleBookmarked()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(val => {
        this.isArticleBookmarked$.next(val);
      });
    this.getRoute();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
  
  getRoute = () => {
    if(this.route.component.toString().split(' ')[1] == 'ArticleHistoryComponent') {
      this.routeLink = `/article/${this.articleData.articleId}/history/${this.articleData.version}`
      
    } else {
      this.routeLink = `/article/${this.articleData.articleId}`
    }
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
          isBookmarked = this.isArticleBookmarked$.value;
        if (isBookmarked) {
          this.articleSvc.unBookmarkArticle(uid, aid);
        } else {
          this.articleSvc.bookmarkArticle(uid, aid);
        }
      }
    });
  };
}
