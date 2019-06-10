import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'cos-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
})
export class StatsComponent {
  @Input() commentCount: number;
  @Input() editCount: number;
  @Input() tagsCount: number;

  @Input() isArticleNew: boolean;
  @Input() isBookmarked: boolean;

  @Output() onBookmarkClicked = new EventEmitter();

  clickBookmark = () => {
    this.onBookmarkClicked.emit();
  };
}
