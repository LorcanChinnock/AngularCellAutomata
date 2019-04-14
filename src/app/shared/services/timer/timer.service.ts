import { Injectable, ChangeDetectorRef } from '@angular/core';
import { TurnTimer } from './turn-timer';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  getTimer(period: number, initialCounter: number = 0, initialIsRunning: boolean = false) {
    return new TurnTimer(period, initialCounter, initialIsRunning);
  }
}
