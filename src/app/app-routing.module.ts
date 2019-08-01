import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from '@components/home/home.component';
import { ArticleComponent } from '@components/articles/article/article.component';
import { ProfileDisplayComponent } from '@components/user/profile/profile-display/profile-display.component';
import { ProfileEditComponent } from '@components/user/profile/profile-edit/profile-edit.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, pathMatch: 'full' },
  { path: 'article/:id', component: ArticleComponent },
  { path: 'createarticle', component: ArticleComponent },
  {
    path: 'profile',
    children: [
      { path: ':uid', component: ProfileDisplayComponent },
      // ToDo: implement AuthGuard for this guy
      { path: '', component: ProfileEditComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
