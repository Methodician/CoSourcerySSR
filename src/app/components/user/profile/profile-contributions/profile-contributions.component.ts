import { Component, OnInit, Input } from '@angular/core';
import { ArticleService } from '@services/article.service';

@Component({
  selector: 'cos-profile-contributions',
  templateUrl: './profile-contributions.component.html',
  styleUrls: ['./profile-contributions.component.scss'],
})
export class ProfileContributionsComponent implements OnInit {
  @Input() profileId: string;

  constructor(private articleSvc: ArticleService) {}

  ngOnInit() {
    if (!this.profileId) {
      console.log('no profileId in contributors component');
      return;
    }
    this.watchAuthoredArticles();
    this.watchEditedArticles();
  }

  watchAuthoredArticles = () => {
    console.log('watching authored articels');
  };

  watchEditedArticles = () => {
    this.articleSvc
      .articlesByEditorQuery(this.profileId)
      .valueChanges()
      .subscribe(val => console.log(val));
  };
}
