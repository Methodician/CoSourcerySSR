import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FireComponent } from './fire/fire.component';
import { MetaComponent } from './meta/meta.component';

const routes: Routes = [
  { path: 'fire', component: FireComponent },
  { path: 'meta', component: MetaComponent },
  { path: '', redirectTo: 'meta', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
