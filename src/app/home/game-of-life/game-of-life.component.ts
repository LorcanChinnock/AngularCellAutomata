import { Component, ViewChild, ElementRef, AfterViewInit, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, timer, Subscription } from 'rxjs';

@Component({
  selector: 'app-game-of-life',
  templateUrl: './game-of-life.component.html',
  styleUrls: ['./game-of-life.component.scss']
})
export class GameOfLifeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameOfLifeCanvas') canvas: ElementRef;

  @Input() public size = 800;
  @Input() public numberOfTiles = 100;
  @Input() public speedInMilliseconds = 50;

  private cellSize: number;

  private simulationState: number[][];

  private context: CanvasRenderingContext2D;
  private timer$: Observable<number> = timer(0, this.speedInMilliseconds);
  private timerSubscription: Subscription;

  constructor() {
    this.cellSize = this.size / this.numberOfTiles;
    this.simulationState = this.create2dArray(this.numberOfTiles);
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.setupCanvas();
    this.setupStateAsRandom();
    this.populateGridRandom();
    this.timerSubscription = this.timer$.subscribe(_ => this.updateState());
  }

  ngOnDestroy(): void {
    this.timerSubscription.unsubscribe();
  }

  private create2dArray(rows: number) {
    const board = Array();
    for (let i = 0; i < rows; i++) {
      board[i] = Array();
    }
    return board;
  }

  private setupCanvas() {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.context.canvas.height = this.size;
    this.context.canvas.width = this.size;
  }

  private setupStateAsRandom() {}

  private populateGridRandom() {
    for (let i = 0; i < this.numberOfTiles; i++) {
      for (let j = 0; j < this.numberOfTiles; j++) {
        this.simulationState[i][j] = this.getOneOrZero();
        if (this.simulationState[i][j] === 1) {
          this.fillRectOnCanvas(i, j);
        } else {
          this.clearRectOnCanvas(i, j);
        }
      }
    }
  }

  private getOneOrZero() {
    return Math.round(Math.random());
  }

  private updateState() {
    const nextState = this.simulationState;
    for (let i = 0; i < this.numberOfTiles; i++) {
      for (let j = 0; j < this.numberOfTiles; j++) {
        const amountOfNeighbours = this.getAmountOfNeighbours(i, j);
        this.updateNextState(i, j, amountOfNeighbours, nextState);
      }
    }
    this.simulationState = nextState;
    this.setDisplayFromState();
  }

  private setDisplayFromState() {
    for (let i = 0; i < this.numberOfTiles; i++) {
      for (let j = 0; j < this.numberOfTiles; j++) {
        if (this.simulationState[i][j] === 1) {
          this.fillRectOnCanvas(i, j);
        } else {
          this.clearRectOnCanvas(i, j);
        }
      }
    }
  }

  private updateNextState(i: number, j: number, amountOfNeighbours: number, nextState: number[][]) {
    if (this.simulationState[i][j] === 0) {
      if (amountOfNeighbours === 3) {
        nextState[i][j] = 1;
      }
    } else {
      if (amountOfNeighbours <= 1) {
        nextState[i][j] = 0;
      } else if (amountOfNeighbours >= 4) {
        nextState[i][j] = 0;
      } else if (amountOfNeighbours === 2 || amountOfNeighbours === 3) {
        nextState[i][j] = 1;
      }
    }
  }

  private fillRectOnCanvas(i: number, j: number) {
    const x = i * this.cellSize;
    const y = j * this.cellSize;
    this.clearRectOnCanvas(x, y);
    this.context.fillRect(x, y, this.cellSize, this.cellSize);
  }

  private clearRectOnCanvas(i: number, j: number) {
    const x = i * this.cellSize;
    const y = j * this.cellSize;
    this.context.clearRect(x, y, this.cellSize, this.cellSize);
  }

  private getAmountOfNeighbours(x: number, y: number) {
    let amount = 0;
    for (let i = -1; i < 1; i++) {
      for (let j = -1; j < 1; j++) {
        if (x + i !== -1 && x + i !== 0) {
          amount += this.simulationState[x + i][y + j];
        }
      }
    }
    return amount;
  }
}
