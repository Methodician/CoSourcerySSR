import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnDestroy,
  OnChanges,
} from '@angular/core';
import { ArticleService } from '@services/article.service';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { ArticleDetailI, ArticlePreviewI } from '@shared_models/article.models';

@Component({
  selector: 'cos-profile-contributions',
  templateUrl: './profile-contributions.component.html',
  styleUrls: ['./profile-contributions.component.scss'],
})
export class ProfileContributionsComponent
  implements OnInit, OnDestroy, OnChanges {
  @Input() profileId: string;

  isAuthoredExpanded = false;
  isEditedExpanded = false;
  authoredArticles$: Observable<ArticlePreviewI[]>;
  editedArticles$: Observable<ArticlePreviewI[]>;

  private minDisplayNum = 3;
  private unsubscribe$: Subject<void> = new Subject();
  constructor(private articleSvc: ArticleService) {}

  ngOnInit() {
    if (!this.profileId) {
      console.log('no profileId in contributors component');
      return;
    }
    this.watchAuthoredArticles();
    this.watchEditedArticles();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.profileId) {
      this.watchAuthoredArticles();
      this.watchEditedArticles();
    }
  }

  toggleAllAuthored = () => {
    this.isAuthoredExpanded = !this.isAuthoredExpanded;
    this.watchAuthoredArticles();
  };

  toggleAllEdited = () => {
    this.isEditedExpanded = !this.isEditedExpanded;
    this.watchEditedArticles();
  };

  watchAuthoredArticles = () => {
    this.authoredArticles$ = this.articleSvc
      .articlesByAuthorRef(this.profileId)
      .valueChanges()
      .pipe(
        map(articles =>
          this.isAuthoredExpanded
            ? articles
            : this.limitDisplayedResults(articles),
        ),
        map(articles =>
          articles.map(art => this.articleSvc.processArticleTimestamps(art)),
        ),
        takeUntil(this.unsubscribe$),
      );
  };

  watchEditedArticles = () => {
    this.editedArticles$ = this.articleSvc
      .articlesByEditorRef(this.profileId)
      .valueChanges()
      .pipe(
        map(articles =>
          this.isEditedExpanded
            ? articles
            : this.limitDisplayedResults(articles),
        ),
        map(articles =>
          articles.map(art => this.articleSvc.processArticleTimestamps(art)),
        ),
        takeUntil(this.unsubscribe$),
      );
  };

  limitDisplayedResults = (results: any[]) =>
    results.slice(0, this.minDisplayNum);

  createPreviewLink = (article: ArticleDetailI) => `/article/${article.slug}`;
}
