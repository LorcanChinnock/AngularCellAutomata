import { Observable, timer, Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

export class TurnTimer {
  timer$: Observable<number>;
  timerCounter$ = new Subject<number>();
  private isRunning: boolean;
  private counter: number;

  constructor(period: number, initialCounter: number = 0, initialIsRunning: boolean = false) {
    this.counter = initialCounter;
    this.isRunning = initialIsRunning;
    this.updateCounterStream();
    this.timer$ = this.createTimer(period);
  }

  reset() {
    this.pause();
    this.counter = 0;
    this.updateCounterStream();
  }

  pause() {
    this.isRunning = false;
  }

  resume() {
    this.isRunning = true;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getCurrentCounter(): number {
    return this.counter;
  }

  private createTimer(period: number): Observable<number> {
    return timer(period / 2, period).pipe(
      filter(_ => this.isRunning === true),
      tap(_ => {
        this.counter++;
        this.updateCounterStream();
      })
    );
  }

  private updateCounterStream() {
    this.timerCounter$.next(this.counter);
  }
}
