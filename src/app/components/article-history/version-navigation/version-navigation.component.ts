import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '@services/article.service';

@Component({
  selector: 'cos-version-navigation',
  templateUrl: './version-navigation.component.html',
  styleUrls: ['./version-navigation.component.scss'],
})
export class VersionNavigationComponent implements OnInit {
  @Input() articleSlug: string;
  @Input() version: string;
  numberOfVersions: number;
  url: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleSvc: ArticleService,
  ) {}

  ngOnInit() {
    this.articleSvc
      .allArticleVersionsRef(this.articleSlug)
      .get()
      .forEach(snapShot => {
        this.numberOfVersions = snapShot.docs.length;
      });
  }

  onClickPrevious() {
    let navigationCount: number =
      parseInt(this.version) === 1
        ? parseInt(this.version)
        : parseInt(this.version) - 1;
    this.router.navigateByUrl(
      `article/${this.articleSlug}/history/${navigationCount}`,
    );
    this.url = `article/${this.articleSlug}/history/${navigationCount}`;
  }

  onClickNext() {
    let navigationCount: number =
      parseInt(this.version) === this.numberOfVersions
        ? parseInt(this.version)
        : parseInt(this.version) + 1;
    this.router.navigateByUrl(
      `article/${this.articleSlug}/history/${navigationCount}`,
    );
    this.url = `article/${this.articleSlug}/history/${navigationCount}`;
  }
}
