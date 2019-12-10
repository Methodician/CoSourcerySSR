import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from '@components/home/home.component';
import { ArticleComponent } from '@components/article/article.component';
import { ArticleHistoryComponent } from '@components/article-history/article-history.component';
import { ProfileDisplayComponent } from '@components/user/profile/profile-display/profile-display.component';
import { ProfileEditComponent } from '@components/user/profile/profile-edit/profile-edit.component';
import { RegisterComponent } from '@components/user/register/register.component';
import { AuthGuard } from '@guards/auth.guard';
import { NotLoggedInComponent } from '@components/shared/not-logged-in/not-logged-in.component';
import { UnsavedChangesGuard } from '@guards/unsaved-changes.guard';
import { VersionDetailComponent } from './components/article-history/version-detail/version-detail.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, pathMatch: 'full' },
  {
    path: 'article/:id',
    component: ArticleComponent,
    canDeactivate: [UnsavedChangesGuard],
  },
  {
    path: 'article/:id/history',
    component: ArticleHistoryComponent,
  },
  {
    path: 'article/:id/history/:versionId',
    component: VersionDetailComponent,
  },
  {
    path: 'createarticle',
    component: ArticleComponent,
    canActivate: [AuthGuard],
    canDeactivate: [UnsavedChangesGuard],
  },
  { path: 'register', component: RegisterComponent },
  {
    path: 'profile',
    children: [
      { path: ':uid', component: ProfileDisplayComponent },
      // TODO: implement AuthGuard for this guy
      { path: '', component: ProfileEditComponent },
    ],
  },
  {
    path: 'notloggedin',
    children: [
      { path: ':redirectPath', component: NotLoggedInComponent },
      { path: '', component: NotLoggedInComponent },
    ],
  },
  { path: '**', redirectTo: 'home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
