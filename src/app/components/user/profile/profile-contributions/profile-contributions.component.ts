import { Component, OnInit, Input } from '@angular/core';
import { ArticleService } from '@services/article.service';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { IArticlePreview } from '@models/article-info';

@Component({
  selector: 'cos-profile-contributions',
  templateUrl: './profile-contributions.component.html',
  styleUrls: ['./profile-contributions.component.scss'],
})
export class ProfileContributionsComponent implements OnInit {
  @Input() profileId: string;

  isAuthoredExpanded = false;
  isEditedExpanded = false;
  authoredArticles$: Observable<IArticlePreview[]>;
  editedArticles$: Observable<IArticlePreview[]>;

  private minDisplayNum = 6;
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
            : this.limitDisplayedResults(articles)
        ),
        map(articles =>
          articles.map(art => this.articleSvc.processArticleTimestamps(art))
        ),
        takeUntil(this.unsubscribe$)
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
            : this.limitDisplayedResults(articles)
        ),
        map(articles =>
          articles.map(art => this.articleSvc.processArticleTimestamps(art))
        ),
        takeUntil(this.unsubscribe$)
      );
  };

  limitDisplayedResults = (results: any[]) =>
    results.slice(0, this.minDisplayNum);
}
