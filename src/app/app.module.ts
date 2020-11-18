import { environment } from '../environments/environment';

// MODULES

// Angular
import {
  BrowserModule,
  BrowserTransferStateModule,
} from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

// AngularFire
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule, SETTINGS } from '@angular/fire/firestore';
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
import { QuillModule } from 'ngx-quill';
// end modules

// Pipes
import { TruncateStringPipe } from '@pipes/truncate-string.pipe';

// COMPONENTS
import { AppComponent } from './app.component';
import { HomeComponent } from '@components/home/home.component';
import { ArticlePreviewCardComponent } from '@components/shared/article-preview-card/article-preview-card.component';
import { TopNavComponent } from '@components/top-nav/top-nav.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FilterMenuComponent } from '@components/home/filter-menu/filter-menu.component';
import { ArticleComponent } from '@components/article/article.component';
import { TitleComponent } from '@components/article/title/title.component';
import { TitleDisplayComponent } from '@components/article/title/title-display/title-display.component';
import { TitleEditComponent } from '@components/article/title/title-edit/title-edit.component';
import { IntroComponent } from '@components/article/intro/intro.component';
import { IntroDisplayComponent } from '@components/article/intro/intro-display/intro-display.component';
import { IntroEditComponent } from '@components/article/intro/intro-edit/intro-edit.component';
import { StatsComponent } from '@components/article/stats/stats.component';
import { ContributorsComponent } from '@components/article/contributors/contributors.component';
import { ProfileCardComponent } from '@components/shared/profile-card/profile-card.component';
import { BodyComponent } from '@components/article/body/body.component';
import { BodyDisplayComponent } from '@components/article/body/body-display/body-display.component';
import { BodyEditComponent } from '@components/article/body/body-edit/body-edit.component';
import { CommentsComponent } from '@components/article/comments/comments.component';
import { CommentComponent } from '@components/article/comments/comment/comment.component';
import { CommentListComponent } from '@components/article/comments/comment-list/comment-list.component';
import { ReverseArrayPipe } from '@pipes/reverse-array.pipe';
import { CoverImageComponent } from '@components/article/cover-image/cover-image.component';
import { CoverImageEditComponent } from '@components/article/cover-image/cover-image-edit/cover-image-edit.component';
import { CoverImageDisplayComponent } from '@components/article/cover-image/cover-image-display/cover-image-display.component';
import { TagsComponent } from '@components/article/tags/tags.component';
import { ProfileDisplayComponent } from '@components/user/profile/profile-display/profile-display.component';
import { ProfileEditComponent } from '@components/user/profile/profile-edit/profile-edit.component';
import { ProfileContributionsComponent } from '@components/user/profile/profile-contributions/profile-contributions.component';
import { RegisterComponent } from '@components/user/register/register.component';
import { NotLoggedInComponent } from '@components/shared/not-logged-in/not-logged-in.component';

// Dialog components
import { LoginDialogComponent } from '@dialogs/login-dialog/login-dialog.component';
import { MessageDialogComponent } from '@dialogs/message-dialog/message-dialog.component';
import { ConfirmDialogComponent } from '@dialogs/confirm-dialog/confirm-dialog.component';
import { ProgressDialogComponent } from '@dialogs/progress-dialog/progress-dialog.component';
import { CountdownDialogComponent } from '@dialogs/countdown-dialog/countdown-dialog.component';
import { ArticleHistoryComponent } from './components/article-history/article-history.component';
import { VersionDetailComponent } from './components/article-history/version-detail/version-detail.component';
import { VersionNavigationComponent } from './components/article-history/version-navigation/version-navigation.component';
import { PreviewCardStatsComponent } from './components/shared/preview-card-stats/preview-card-stats.component';
import { TimeElapsedPipe } from './shared/pipes/time-elapsed.pipe';
import { PreviewGridComponent } from './components/shared/preview-grid/preview-grid.component';
import { CustomEditorTestComponent } from './components/article/custom-editor-test/custom-editor-test.component';
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
    CoverImageComponent,
    TagsComponent,
    ProfileDisplayComponent,
    ProfileEditComponent,
    CoverImageEditComponent,
    ProfileContributionsComponent,
    LoginDialogComponent,
    MessageDialogComponent,
    ConfirmDialogComponent,
    ProgressDialogComponent,
    RegisterComponent,
    NotLoggedInComponent,
    CountdownDialogComponent,
    ArticleHistoryComponent,
    VersionDetailComponent,
    VersionNavigationComponent,
    PreviewCardStatsComponent,
    TimeElapsedPipe,
    PreviewGridComponent,
    CustomEditorTestComponent,
  ],
  entryComponents: [
    LoginDialogComponent,
    MessageDialogComponent,
    ConfirmDialogComponent,
    ProgressDialogComponent,
    CountdownDialogComponent,
  ],
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireDatabaseModule,
    AngularFireStorageModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    HttpClientModule,
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
    QuillModule.forRoot(),
  ],
  // providers: [],
  providers: [
    {
      provide: SETTINGS,
      useValue: environment.shouldUseEmulator
        ? {
            host: 'localhost:8080',
            ssl: false,
          }
        : undefined,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
