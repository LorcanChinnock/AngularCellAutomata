import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/core';
import { Shell } from '@app/shell/shell.service';
import { GameOfLifeComponent } from './game-of-life.component';

const routes: Routes = [
  Shell.childRoutes([
    { path: '', redirectTo: '/gameoflife', pathMatch: 'full' },
    { path: 'gameoflife', component: GameOfLifeComponent, data: { title: extract('GameOfLife') } }
  ])
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class GameOfLifeRoutingModule {}
