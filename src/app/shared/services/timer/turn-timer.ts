import { Observable, timer, Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

export class TurnTimer {
  timer$: Observable<number>;
  timerCounter$ = new Subject<number>();
  isRunning = false;

  private counter = 0;

  constructor(stepTime: number, startDelay: number) {
    this.updateCounterStream();
    this.timer$ = timer(startDelay, stepTime).pipe(
      filter(_ => this.isRunning === true),
      tap(_ => {
        this.counter++;
        this.updateCounterStream();
      })
    );
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

  private updateCounterStream() {
    this.timerCounter$.next(this.counter);
  }
}
