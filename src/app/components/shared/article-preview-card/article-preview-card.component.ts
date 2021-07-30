import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ArticlePreviewI } from '@shared_models/article.models';
import { Subject, Observable } from 'rxjs';
import { StorageService } from '@services/storage.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'cos-article-preview-card',
  templateUrl: './article-preview-card.component.html',
  styleUrls: ['./article-preview-card.component.scss'],
})
export class ArticlePreviewCardComponent implements OnInit, OnDestroy {
  @Input() linkTo: string;
  @Input() set articleData(data: ArticlePreviewI) {
    // Hacky but works and it's performant
    // It appears that Firestore dates transferred in NgRx/SSR get
    // converted to a string along the way and this just converts it
    // back to date if it happened, and does nothing if it's already date

    this.article = { ...data, lastUpdated: new Date(data.lastUpdated) };
  }

  article: ArticlePreviewI;
  coverImageUrl = '';
  isArticleBookmarked$: Observable<boolean>;
  private unsubscribe: Subject<void> = new Subject();

  constructor(private storageSvc: StorageService) {}

  ngOnInit() {
    this.watchCoverImageUrl();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  watchCoverImageUrl = () => {
    const { articleId, coverImageId } = this.article;
    if (!!coverImageId) {
      this.storageSvc
        .getImageUrl(`articleCoverThumbnails/${articleId}/${coverImageId}`)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(url => {
          this.coverImageUrl = url;
        });
    }
  };
}
