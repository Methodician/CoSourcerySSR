import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'cos-version-navigation',
  templateUrl: './version-navigation.component.html',
  styleUrls: ['./version-navigation.component.scss'],
})
export class VersionNavigationComponent implements OnInit {
  @Input() articleSlug: string;
  @Input() version: string;
  url: string;
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {}

  onClickPrevious() {
    let navigationCount: number = parseInt(this.version) - 1;
    this.router.navigateByUrl(
      `article/${this.articleSlug}/history/${navigationCount}`,
    );
    this.url = `article/${this.articleSlug}/history/${navigationCount}`;
  }

  onClickNext() {
    let navigationCount: number = parseInt(this.version) + 1;
    this.router.navigateByUrl(
      `article/${this.articleSlug}/history/${navigationCount}`,
    );
    this.url = `article/${this.articleSlug}/history/${navigationCount}`;
  }
}
