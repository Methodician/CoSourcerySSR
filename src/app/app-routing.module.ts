import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FireComponent } from './fire/fire.component';
import { MetaComponent } from './meta/meta.component';
import { FireDetailComponent } from './fire-detail/fire-detail.component';
import { HomeComponent } from '@components/home/home.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent, pathMatch: 'full' },
  { path: 'fire', component: FireComponent, pathMatch: 'full' },
  { path: 'fire/:id', component: FireDetailComponent, pathMatch: 'full' },
  { path: 'meta', component: MetaComponent, pathMatch: 'full' },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
