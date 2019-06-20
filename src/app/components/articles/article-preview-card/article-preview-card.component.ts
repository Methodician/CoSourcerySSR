import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { ArticleService } from '@services/article.service';
import { ArticlePreview } from '@models/interfaces/article-info';
import { MatDialog } from '@angular/material/dialog';
// import { LoginDialogComponent } from '@modals/login-dialog/login-dialog.component';

@Component({
  selector: 'cos-article-preview-card',
  templateUrl: './article-preview-card.component.html',
  styleUrls: ['./article-preview-card.component.scss'],
})
export class ArticlePreviewCardComponent implements OnInit, OnChanges {
  @Input() articleData: ArticlePreview;
  @Input() userId: string;
  isArticleBookmarked: boolean;
  constructor(private articleSvc: ArticleService, private dialog: MatDialog) {}

  ngOnInit() {
    // if (this.userId) {
    //   this.checkIfBookmarked();
    // }
    // const url = this.articleData.imageUrl;
    // if (url === 'unset') {
    //   this.articleSvc.setThumbnailImageUrl(this.articleData.articleId);
    // }
  }

  ngOnChanges(changes: SimpleChanges) {
    // if (changes.userId.currentValue) {
    //   this.checkIfBookmarked();
    // }
  }

  // async checkIfBookmarked() {
  //   const ref = await this.articleSvc.bookmarkedRef(
  //     this.userId,
  //     this.articleData.articleId,
  //   );
  //   ref.valueChanges().subscribe(snapshot => {
  //     if (snapshot && snapshot.toString().length === 13) {
  //       this.isArticleBookmarked = true;
  //     } else {
  //       this.isArticleBookmarked = false;
  //     }
  //   });
  // }

  // bookmarkToggle() {
  //   if (this.userId) {
  //     if (this.isArticleBookmarked) {
  //       this.articleSvc.unBookmarkArticle(
  //         this.userId,
  //         this.articleData.articleId,
  //       );
  //     } else {
  //       this.articleSvc.bookmarkArticle(
  //         this.userId,
  //         this.articleData.articleId,
  //       );
  //     }
  //   }
  // }

  // authCheck() {
  //   if (this.userId) {
  //     return true;
  //   } else {
  //     this.dialog.open(LoginDialogComponent);
  //     return false;
  //   }
  // }
}
