import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  OnDestroy,
  HostListener,
  ChangeDetectionStrategy,
  OnInit,
  AfterContentInit
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ChanceService } from '@app/shared/services/chanceService/chance.service';
import { TimerService } from '@app/shared/services/timer/timer.service';
import { TurnTimer } from '@app/shared/services/timer/turn-timer';

@Component({
  selector: 'app-game-of-life',
  templateUrl: './game-of-life.component.html',
  styleUrls: ['./game-of-life.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameOfLifeComponent implements OnInit, AfterContentInit, OnDestroy {
  turnTimer: TurnTimer;

  @ViewChild('gameOfLifeCanvas') canvas: ElementRef;

  @Input() public numberOfTiles = 100;
  @Input() public speedInMilliseconds = 100;
  @Input() public aliveStartPercentage = 10;

  private screenHeight: number;
  private screenWidth: number;
  private cellSize: number;
  private currentState: number[][];
  private nextState: number[][];
  private context: CanvasRenderingContext2D;
  private timerSubscription: Subscription;

  constructor(private chanceService: ChanceService, timerService: TimerService) {
    this.turnTimer = timerService.getTimer(50, 0);
    this.onResize();
    this.calculateCellSize();
    this.currentState = this.initialiseStateArray();
  }

  @HostListener('window:resize', ['$event'])
  onResize(_?: Event) {
    this.screenHeight = window.innerHeight - 80;
    this.screenWidth = window.innerWidth;
  }

  ngOnInit(): void {
    this.setupCanvas();
    this.timerSubscription = this.turnTimer.timer$.subscribe(_ => this.updateState());
  }

  ngAfterContentInit(): void {
    this.resetGame();
  }

  ngOnDestroy(): void {
    this.timerSubscription.unsubscribe();
  }

  start() {
    if (!this.turnTimer.isRunning) {
      this.turnTimer.resume();
    }
  }

  togglePause() {
    if (this.turnTimer.isRunning) {
      this.turnTimer.pause();
    } else {
      this.turnTimer.resume();
    }
  }

  resetGame() {
    this.turnTimer.reset();
    this.populateGridRandom();
  }

  private calculateCellSize() {
    this.cellSize = this.getMinScreenDimension() / this.numberOfTiles;
  }

  private initialiseStateArray() {
    const board = Array();
    for (let i = 0; i < this.numberOfTiles; i++) {
      board[i] = Array();
    }
    return board;
  }

  private setupCanvas() {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.context.canvas.height = this.getMinScreenDimension();
    this.context.canvas.width = this.getMinScreenDimension();
  }

  private getMinScreenDimension() {
    return Math.min(this.screenHeight, this.screenWidth);
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
