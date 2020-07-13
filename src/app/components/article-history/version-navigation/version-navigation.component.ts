import { Component, OnChanges, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ArticleService } from '@services/article.service';

@Component({
  selector: 'cos-version-navigation',
  templateUrl: './version-navigation.component.html',
  styleUrls: ['./version-navigation.component.scss'],
})
export class VersionNavigationComponent implements OnChanges {
  @Input() articleId: string;
  @Input() articleSlug: string;
  @Input() version: string;
  numberOfVersions: number;

  constructor(private router: Router, private articleSvc: ArticleService) {}

  ngOnChanges() {
    this.articleSvc
      .articlePreviewRef(this.articleId)
      .valueChanges()
      .subscribe(article => (this.numberOfVersions = article.version));
  }

  onClickPrevious() {
    let targetVersionNumber: number =
      parseInt(this.version) === 1
        ? this.numberOfVersions
        : parseInt(this.version) - 1;
    this.router.navigateByUrl(
      `article/${this.articleSlug}/history/${targetVersionNumber}`,
    );
  }

  onClickNext() {
    let versionNumber: number =
      parseInt(this.version) === this.numberOfVersions
        ? 1
        : parseInt(this.version) + 1;
    this.router.navigateByUrl(
      `article/${this.articleSlug}/history/${versionNumber}`,
    );
  }
}
