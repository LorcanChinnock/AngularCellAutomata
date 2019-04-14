import { Injectable } from '@angular/core';
import { TurnTimer } from './turn-timer';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  constructor() {}

  getTimer(stepTime: number, startDelay: number) {
    return new TurnTimer(stepTime, startDelay);
  }
}
