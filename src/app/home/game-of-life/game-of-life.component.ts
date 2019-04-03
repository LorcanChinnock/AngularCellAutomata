import { Component, ViewChild, ElementRef, AfterViewInit, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, timer, Subscription } from 'rxjs';
import { ChanceService } from '@app/shared/services/chanceService/chance.service';

@Component({
  selector: 'app-game-of-life',
  templateUrl: './game-of-life.component.html',
  styleUrls: ['./game-of-life.component.scss']
})
export class GameOfLifeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameOfLifeCanvas') canvas: ElementRef;

  @Input() public size = 800;
  @Input() public numberOfTiles = 100;
  @Input() public speedInMilliseconds = 10;
  @Input() public aliveStartPercentage = 10;

  private cellSize: number;

  private currentState: number[][];
  private nextState: number[][];

  private context: CanvasRenderingContext2D;
  private timer$: Observable<number> = timer(0, this.speedInMilliseconds);
  private timerSubscription: Subscription;

  constructor(private chanceService: ChanceService) {
    this.cellSize = this.size / this.numberOfTiles;
    this.currentState = this.create2dArray();
  }

  ngAfterViewInit(): void {
    this.setupCanvas();
    this.populateGridRandom();
    this.timerSubscription = this.timer$.subscribe(_ => this.updateState());
  }

  ngOnDestroy(): void {
    this.timerSubscription.unsubscribe();
  }

  private create2dArray() {
    const board = Array();
    for (let i = 0; i < this.numberOfTiles; i++) {
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
        this.currentState[i][j] = this.getOneOrZero();
      }
    }
    this.setDisplayFromCurrentState();
  }

  private getOneOrZero() {
    const deadStartWeight = (100 - this.aliveStartPercentage) / this.aliveStartPercentage;
    const values = Array<number>(0, 1);
    const weights = Array<number>(deadStartWeight, 1);
    return this.chanceService.getWeightedRandom(values, weights);
  }

  private updateState() {
    this.nextState = this.currentState;
    for (let i = 0; i < this.numberOfTiles; i++) {
      for (let j = 0; j < this.numberOfTiles; j++) {
        this.findNextStateWithRules(i, j);
      }
    }
    this.currentState = this.nextState;
    this.setDisplayFromCurrentState();
  }

  private findNextStateWithRules(xPos: number, yPos: number) {
    const isAlive = this.currentState[xPos][yPos] === 1;
    const currentAmountOfNeighbours = this.getAmountOfNeighbours(xPos, yPos);
    const shouldDieDueToUnderPopulation = currentAmountOfNeighbours <= 1;
    const shouldDieDueToOverPopulation = currentAmountOfNeighbours >= 4;
    const shouldBecomeLive = currentAmountOfNeighbours === 3;
    if (isAlive) {
      if (shouldDieDueToUnderPopulation || shouldDieDueToOverPopulation) {
        this.nextState[xPos][yPos] = 0;
      }
    } else {
      if (shouldBecomeLive) {
        this.nextState[xPos][yPos] = 1;
      }
    }
  }

  private setDisplayFromCurrentState() {
    for (let i = 0; i < this.numberOfTiles; i++) {
      for (let j = 0; j < this.numberOfTiles; j++) {
        if (this.currentState[i][j] === 1) {
          this.setCellToBlack(i, j);
        } else {
          this.clearCell(i, j);
        }
      }
    }
  }

  private setCellToBlack(i: number, j: number) {
    const cellXPos = i * this.cellSize;
    const cellYPos = j * this.cellSize;
    this.clearCell(cellXPos, cellYPos);
    this.context.fillRect(cellXPos, cellYPos, this.cellSize, this.cellSize);
  }

  private clearCell(i: number, j: number) {
    const cellXPos = i * this.cellSize;
    const cellYPos = j * this.cellSize;
    this.context.clearRect(cellXPos, cellYPos, this.cellSize, this.cellSize);
  }

  private getAmountOfNeighbours(x: number, y: number) {
    let amount = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const posX = x + i;
        const posY = y + j;
        const isSelf = i === 0 && j === 0;
        if (this.isWithinSimulationRange(posX, posY) && !isSelf) {
          amount += this.currentState[posX][posY];
        }
      }
    }
    return amount;
  }

  private isWithinSimulationRange(posX: number, posY: number) {
    return posX >= 0 && posX < this.numberOfTiles && posY >= 0 && posY < this.numberOfTiles;
  }
}
