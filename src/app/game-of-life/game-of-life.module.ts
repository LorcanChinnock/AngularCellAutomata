import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CoreModule } from 'app/core';
import { SharedModule } from 'app/shared';
import { GameOfLifeComponent } from './game-of-life.component';
import { GameOfLifeRoutingModule } from './game-of-life-routing.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, TranslateModule, CoreModule, SharedModule, GameOfLifeRoutingModule, FormsModule],
  declarations: [GameOfLifeComponent],
  providers: []
})
export class GameOfLifeModule {}
