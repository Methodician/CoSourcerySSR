import { environment } from '../environments/environment';

import {
  BrowserModule,
  BrowserTransferStateModule,
} from '@angular/platform-browser';
import { NgModule } from '@angular/core';

// MODULES
// AngularFire
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Angular Material
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

// Other
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { AppRoutingModule } from './app-routing.module';
// end modules

// Pipes
import { TruncateStringPipe } from '@pipes/truncate-string.pipe';

// COMPONENTS
import { AppComponent } from './app.component';
import { HomeComponent } from '@components/home/home.component';
import { ArticlePreviewCardComponent } from '@components/articles/article-preview-card/article-preview-card.component';
import { TopNavComponent } from '@components/top-nav/top-nav.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FilterMenuComponent } from '@components/home/filter-menu/filter-menu.component';
import { ArticleComponent } from '@components/articles/article/article.component';
import { TitleComponent } from '@components/articles/article/title/title.component';
import { TitleDisplayComponent } from '@components/articles/article/title/title-display/title-display.component';
import { TitleEditComponent } from '@components/articles/article/title/title-edit/title-edit.component';
import { IntroComponent } from '@components/articles/article/intro/intro.component';
import { IntroDisplayComponent } from '@components/articles/article/intro/intro-display/intro-display.component';
import { IntroEditComponent } from '@components/articles/article/intro/intro-edit/intro-edit.component';
import { StatsComponent } from '@components/articles/article/stats/stats.component';
import { ContributorsComponent } from '@components/articles/article/contributors/contributors.component';
import { ProfileCardComponent } from '@components/shared/profile-card/profile-card.component';
import { BodyComponent } from '@components/articles/article/body/body.component';
import { BodyDisplayComponent } from '@components/articles/article/body/body-display/body-display.component';
import { BodyEditComponent } from '@components/articles/article/body/body-edit/body-edit.component';
import { CommentsComponent } from '@components/articles/article/comments/comments.component';
import { CommentComponent } from '@components/articles/article/comments/comment/comment.component';
import { CommentListComponent } from '@components/articles/article/comments/comment-list/comment-list.component';
import { ReverseArrayPipe } from '@pipes/reverse-array.pipe';
import { CoverImageComponent } from '@components/articles/article/cover-image/cover-image.component';
import { CoverImageEditComponent } from '@components/articles/article/cover-image/cover-image-edit/cover-image-edit.component';
import { CoverImageDisplayComponent } from '@components/articles/article/cover-image/cover-image-display/cover-image-display.component';

// Dialog components
import { LoginDialogComponent } from '@components/modals/login-dialog/login-dialog.component';
import { MessageDialogComponent } from '@components/modals/message-dialog/message-dialog.component';
import { ConfirmDialogComponent } from '@components/modals/confirm-dialog/confirm-dialog.component';
import { ProgressDialogComponent } from '@components/modals/progress-dialog/progress-dialog.component';
import { TagsComponent } from '@components/articles/article/tags/tags.component';
import { ProfileComponent } from './components/user/profile/profile.component';
import { ProfileDisplayComponent } from './components/user/profile/profile-display/profile-display.component';
import { ProfileEditComponent } from './components/user/profile/profile-edit/profile-edit.component';
// end components
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ArticlePreviewCardComponent,
    TruncateStringPipe,
    TopNavComponent,
    FilterMenuComponent,
    ArticleComponent,
    CoverImageDisplayComponent,
    TitleComponent,
    TitleDisplayComponent,
    TitleEditComponent,
    IntroComponent,
    IntroDisplayComponent,
    IntroEditComponent,
    StatsComponent,
    ContributorsComponent,
    ProfileCardComponent,
    BodyComponent,
    BodyDisplayComponent,
    BodyEditComponent,
    CommentsComponent,
    CommentComponent,
    CommentListComponent,
    ReverseArrayPipe,
    LoginDialogComponent,
    MessageDialogComponent,
    ConfirmDialogComponent,
    CoverImageComponent,
    CoverImageEditComponent,
    ProgressDialogComponent,
    TagsComponent,
    ProfileComponent,
    ProfileDisplayComponent,
    ProfileEditComponent,
  ],
  entryComponents: [
    LoginDialogComponent,
    MessageDialogComponent,
    ConfirmDialogComponent,
    ProgressDialogComponent,
  ],
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireDatabaseModule,
    AngularFireStorageModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    MatChipsModule,
    MatProgressBarModule,
    CKEditorModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
