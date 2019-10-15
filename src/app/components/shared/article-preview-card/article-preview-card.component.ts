import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { map, switchMap } from 'rxjs/operators';

import { ArticleService } from '@services/article.service';
import { IArticlePreview } from '@models/article-info';
import { AuthService } from '@services/auth.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { storage } from 'firebase';

@Component({
  selector: 'cos-article-preview-card',
  templateUrl: './article-preview-card.component.html',
  styleUrls: ['./article-preview-card.component.scss'],
})
export class ArticlePreviewCardComponent implements OnInit, OnDestroy {
  @Input() articleData: IArticlePreview;
  coverImageUrl: any;
  isArticleBookmarked$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private articleSvc: ArticleService,
    private authSvc: AuthService
  ) {}

  ngOnInit() {
    this.getCoverImageUrl().then(url => (this.coverImageUrl = url));
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

  getCoverImageUrl = async () => {
    const imageRef = storage().ref(
      `articleCoverImages/${this.articleData.articleId}`
    );
    try {
      const url = await imageRef.getDownloadURL();
      console.log(url);
      return url;
    } catch (error) {
      if (error.code !== 'storage/object-not-found') {
        console.warn('We should handle other cases such as:');
        console.error(error);
      }
      return '../../assets/images/logo.svg';
    }
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
