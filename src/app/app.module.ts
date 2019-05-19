import { environment } from '../environments/environment';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';

import { MatIconModule, MatDialogModule } from '@angular/material';

import { AppRoutingModule } from './app-routing.module';

import { TruncateStringPipe } from './shared/pipes/truncate-string.pipe';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { ArticlePreviewCardComponent } from './components/articles/article-preview-card/article-preview-card.component';
import { TopNavComponent } from './components/top-nav/top-nav.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ArticlePreviewCardComponent,
    TruncateStringPipe,
    TopNavComponent,
  ],
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    MatIconModule,
    MatDialogModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
