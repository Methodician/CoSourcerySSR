import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FireComponent } from './fire/fire.component';
import { MetaComponent } from './meta/meta.component';
import { FireDetailComponent } from './fire-detail/fire-detail.component';

const routes: Routes = [
  { path: 'fire', component: FireComponent, pathMatch: 'full' },
  { path: 'fire/:id', component: FireDetailComponent, pathMatch: 'full' },
  { path: 'meta', component: MetaComponent, pathMatch: 'full' },
  { path: '', redirectTo: 'meta', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
