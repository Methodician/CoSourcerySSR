import { Component, Input, OnInit } from '@angular/core';
import { UserService } from '@services/user.service';
import { ArticleService } from '@services/article.service';
import { Observable } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'cos-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
})
export class StatsComponent implements OnInit {
  @Input() commentCount: number;
  @Input() editCount: number;
  @Input() tagsCount: number;
  @Input() articleId: string;
  @Input() isArticleNew: boolean;
  @Input() slug: string;

  isBookmarked$: Observable<boolean>;

  constructor(
    private userSvc: UserService,
    private authSvc: AuthService,
    private articleSvc: ArticleService
  ) {}
  ngOnInit() {
    this.isBookmarked$ = this.userSvc.loggedInUser$
      .pipe(
        switchMap(user =>
          this.articleSvc
            .singleBookmarkRef(user.uid, this.articleId)
            .valueChanges()
        )
      )
      .pipe(map(timestamp => !!timestamp));
  }

  onBookmarkClicked = () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (isSignedIn) this.toggleBookmark();
    });
  };

  toggleBookmark = () => {
    this.isBookmarked$.pipe(take(1)).subscribe(isBookmarked => {
      this.userSvc.loggedInUser$.pipe(take(1)).subscribe(user => {
        if (isBookmarked) {
          this.articleSvc.unBookmarkArticle(user.uid, this.articleId);
        } else {
          this.articleSvc.bookmarkArticle(user.uid, this.articleId);
        }
      });
    });
  };
}
