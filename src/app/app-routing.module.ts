import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from '@components/home/home.component';
import { ArticleComponent } from '@components/articles/article/article.component';
import { ProfileComponent } from '@components/user/profile/profile.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, pathMatch: 'full' },
  { path: 'article/:id', component: ArticleComponent },
  { path: 'createarticle', component: ArticleComponent },
  {
    path: 'profile',
    children: [
      { path: ':uid', component: ProfileComponent },
      // ToDo: implement AuthGuard for this guy
      { path: '', component: ProfileComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
