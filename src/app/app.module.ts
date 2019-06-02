import { environment } from '../environments/environment';

import {
  BrowserModule,
  BrowserTransferStateModule,
} from '@angular/platform-browser';
import { NgModule } from '@angular/core';

// AngularFire
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireDatabaseModule } from '@angular/fire/database';

// Angular Material
import {
  MatIconModule,
  MatDialogModule,
  MatInputModule,
  MatChipsModule,
} from '@angular/material';

import { AppRoutingModule } from './app-routing.module';

// Pipes
import { TruncateStringPipe } from './shared/pipes/truncate-string.pipe';

// Components
import { AppComponent } from './app.component';
import { HomeComponent } from '@components/home/home.component';
import { ArticlePreviewCardComponent } from '@components/articles/article-preview-card/article-preview-card.component';
import { TopNavComponent } from '@components/top-nav/top-nav.component';
import { LoginDialogComponent } from '@components/modals/login-dialog/login-dialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FilterMenuComponent } from '@components/home/filter-menu/filter-menu.component';
import { ArticleComponent } from '@components/articles/article/article.component';
import { CoverImageDisplayComponent } from './components/articles/article/cover-image-display/cover-image-display.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ArticlePreviewCardComponent,
    TruncateStringPipe,
    TopNavComponent,
    LoginDialogComponent,
    FilterMenuComponent,
    ArticleComponent,
    CoverImageDisplayComponent,
  ],
  entryComponents: [LoginDialogComponent],
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireDatabaseModule,
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
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
