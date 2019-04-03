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
  @Input() public numberOfTiles = 200;
  @Input() public speedInMilliseconds = 1;

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

  private populateGridRandom() {
    for (let i = 0; i < this.numberOfTiles; i++) {
      for (let j = 0; j < this.numberOfTiles; j++) {
        this.simulationState[i][j] = this.getOneOrZero();
      }
    }
    this.setDisplayFromState(this.simulationState);
  }

  private getOneOrZero() {
    return Math.round(Math.random());
  }

  private updateState() {
    const nextState = this.simulationState;
    for (let i = 0; i < this.numberOfTiles; i++) {
      for (let j = 0; j < this.numberOfTiles; j++) {
        this.applySimulationRulesToState(i, j, nextState);
      }
    }
    this.simulationState = nextState;
    this.setDisplayFromState(this.simulationState);
  }

  private applySimulationRulesToState(xPos: number, yPos: number, nextState: number[][]) {
    const currentAmountOfNeighbours = this.getAmountOfNeighbours(xPos, yPos);
    if (this.simulationState[xPos][yPos] === 0) {
      if (currentAmountOfNeighbours === 3) {
        nextState[xPos][yPos] = 1;
      }
    } else {
      if (currentAmountOfNeighbours <= 1) {
        nextState[xPos][yPos] = 0;
      } else if (currentAmountOfNeighbours >= 4) {
        nextState[xPos][yPos] = 0;
      } else if (currentAmountOfNeighbours === 2 || currentAmountOfNeighbours === 3) {
        nextState[xPos][yPos] = 1;
      }
    }
  }

  private setDisplayFromState(state: number[][]) {
    for (let i = 0; i < this.numberOfTiles; i++) {
      for (let j = 0; j < this.numberOfTiles; j++) {
        if (state[i][j] === 1) {
          this.setCellToBlack(i, j);
        } else {
          this.clearCell(i, j);
        }
      }
    }
  }

  private setCellToBlack(i: number, j: number) {
    const x = i * this.cellSize;
    const y = j * this.cellSize;
    this.clearCell(x, y);
    this.context.fillRect(x, y, this.cellSize, this.cellSize);
  }

  private clearCell(i: number, j: number) {
    const x = i * this.cellSize;
    const y = j * this.cellSize;
    this.context.clearRect(x, y, this.cellSize, this.cellSize);
  }

  private getAmountOfNeighbours(x: number, y: number) {
    let amount = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const posX = x + i;
        const posY = y + j;
        if (posX >= 0 && posX < this.numberOfTiles && posY >= 0 && posY < this.numberOfTiles) {
          amount += this.simulationState[posX][posY];
        }
        if (i !== 0 && j !== 0) {
        }
      }
    }
    return amount;
  }
}
