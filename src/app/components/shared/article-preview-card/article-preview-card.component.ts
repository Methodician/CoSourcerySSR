import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { IArticlePreview } from '@models/article-info';
import { Subject, Observable } from 'rxjs';
import { StorageService } from '@services/storage.service';

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

  constructor(private storageSvc: StorageService) {}

  ngOnInit() {
    this.watchCoverImageUrl();
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
}
