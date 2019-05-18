import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MetaComponent } from './meta/meta.component';
import { FireComponent } from './fire/fire.component';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';

import { environment } from '../environments/environment';
import { FireDetailComponent } from './fire-detail/fire-detail.component';
import { HomeComponent } from './components/home/home.component';
import { ArticlePreviewCardComponent } from './components/articles/article-preview-card/article-preview-card.component';
import { TruncateStringPipe } from './shared/pipes/truncate-string.pipe';
import { MatIconModule, MatDialogModule } from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    MetaComponent,
    FireComponent,
    FireDetailComponent,
    HomeComponent,
    ArticlePreviewCardComponent,
    TruncateStringPipe,
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
