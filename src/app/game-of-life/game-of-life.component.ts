import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ChanceService } from '@app/shared/services/chanceService/chance.service';
import { TimerService } from '@app/shared/services/timer/timer.service';
import { TurnTimer } from '@app/shared/services/timer/turn-timer';
import { Point } from '@app/shared/models/point';

@Component({
  selector: 'app-game-of-life',
  templateUrl: './game-of-life.component.html',
  styleUrls: ['./game-of-life.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameOfLifeComponent implements OnInit, AfterContentInit, OnDestroy {
  turnTimer: TurnTimer;

  persistentCounter = new BehaviorSubject<number>(0);

  @Input() numberOfTiles = 250;
  @Input() speedInMilliseconds = 10;
  @Input() aliveStartPercentage = 25;

  @ViewChild('gameOfLifeCanvas') canvas: ElementRef;

  private screenHeight: number;
  private screenWidth: number;
  private cellSize: number;
  private currentState: number[][];
  private canvasContext: CanvasRenderingContext2D;
  private timerSubscription: Subscription;
  private counterSubscription: Subscription;

  constructor(private chanceService: ChanceService, private timerService: TimerService) {
    this.turnTimer = timerService.getTimer(this.speedInMilliseconds);
    this.resolveScreenSize();
    this.calculateCellSize();
    this.currentState = this.create2DArray(this.numberOfTiles);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resolveScreenSize();
    this.setupCanvas();
    this.updateState(true);
  }

  ngOnInit(): void {
    this.setupCanvas();
    this.setupTimerSubscription();
  }

  ngAfterContentInit(): void {
    this.resetGame();
  }

  ngOnDestroy(): void {
    this.timerSubscription.unsubscribe();
    this.counterSubscription.unsubscribe();
  }

  start() {
    this.turnTimer.resume();
  }

  togglePause() {
    if (this.turnTimer.getIsRunning()) {
      this.turnTimer.pause();
    } else {
      this.turnTimer.resume();
    }
  }

  resetGame() {
    this.turnTimer.reset();
    this.setupCanvas();
    this.calculateCellSize();

    this.currentState = this.create2DArray(this.numberOfTiles);
    this.populateGridRandom();
  }

  changeSpeed() {
    this.timerSubscription.unsubscribe();
    this.turnTimer = this.timerService.getTimer(
      this.speedInMilliseconds,
      this.turnTimer.getCurrentCounter(),
      this.turnTimer.getIsRunning()
    );
    this.setupTimerSubscription();
  }

  changeStartPercentage() {
    if (this.turnTimer.getCurrentCounter() === 0) {
      this.resetGame();
    }
  }

  changeNumberOfTiles() {
    if (this.turnTimer.getCurrentCounter() === 0) {
      this.resetGame();
    }
  }

  private create2DArray(length: number): number[][] {
    return new Array(length).fill(0).map(() => new Array(length).fill(0));
  }

  private resolveScreenSize() {
    this.screenHeight = window.innerHeight - 100;
    this.screenWidth = window.innerWidth;
  }

  private setupTimerSubscription() {
    this.timerSubscription = this.turnTimer.timer$.subscribe(() => {
      this.updateState(false);
    });
    this.counterSubscription = this.turnTimer.timerCounter$.subscribe(count => {
      this.persistentCounter.next(count);
    });
  }

  private calculateCellSize() {
    this.cellSize = this.getMinScreenDimension() / this.numberOfTiles;
  }

  private setupCanvas() {
    this.canvasContext = this.canvas.nativeElement.getContext('2d');
    const minScreenDimension = this.getMinScreenDimension();
    this.canvasContext.canvas.height = minScreenDimension;
    this.canvasContext.canvas.width = minScreenDimension;
    this.setupCanvasEventListeners();
  }

  private setupCanvasEventListeners() {
    this.canvasContext.canvas.addEventListener('mousedown', mouseEvent => {
      mouseEvent.preventDefault();
    });
    this.canvasContext.canvas.addEventListener('click', mouseEvent => {
      this.calculateCellFromPixel(mouseEvent);
    });
  }

  private calculateCellFromPixel(mouseEvent: MouseEvent) {
    const canvasBounds = this.canvasContext.canvas.getBoundingClientRect();
    const mouseEventCellPoint = new Point(
      Math.floor((mouseEvent.clientX - canvasBounds.left) / this.cellSize),
      Math.floor((mouseEvent.clientY - canvasBounds.top) / this.cellSize)
    );
    this.toggleCellManual(mouseEventCellPoint);
  }

  private toggleCellManual(cellPoint: Point) {
    if (this.currentState[cellPoint.x][cellPoint.y] === 1) {
      this.killCell(cellPoint.x, cellPoint.y);
      this.currentState[cellPoint.x][cellPoint.y] = 0;
    } else {
      this.populateCell(cellPoint.x, cellPoint.y);
      this.currentState[cellPoint.x][cellPoint.y] = 1;
    }
  }

  private populateGridRandom() {
    this.clearCanvas();
    for (let i = 0; i < this.numberOfTiles; i++) {
      for (let j = 0; j < this.numberOfTiles; j++) {
        this.currentState[i][j] = this.getOneOrZero();
        if (this.currentState[i][j] === 1) {
          this.populateCell(i, j);
        }
      }
    }
  }

  private getOneOrZero() {
    const deadStartWeight = (100 - this.aliveStartPercentage) / this.aliveStartPercentage;
    const values = Array<number>(0, 1);
    const weights = Array<number>(deadStartWeight, 1);
    return this.chanceService.getWeightedRandom(values, weights);
  }

  private updateState(onResize: boolean) {
    this.clearCanvas();
    if (!onResize) {
      const nextState = this.create2DArray(this.numberOfTiles);
      for (let i = 0; i < this.numberOfTiles; i++) {
        for (let j = 0; j < this.numberOfTiles; j++) {
          if (this.findNextStateWithRules(i, j) === 1) {
            this.populateCell(i, j);
            nextState[i][j] = 1;
          }
        }
      }
      this.currentState = nextState;
    }
  }

  private findNextStateWithRules(xPos: number, yPos: number): number {
    const isAlive = this.currentState[xPos][yPos] === 1;
    const currentAmountOfNeighbours = this.getAmountOfNeighbours(xPos, yPos);

    if (isAlive) {
      if (currentAmountOfNeighbours <= 1 || currentAmountOfNeighbours >= 4) {
        return 0;
      } else {
        return 1;
      }
    } else {
      if (currentAmountOfNeighbours === 3) {
        return 1;
      } else {
        return 0;
      }
    }
  }

  private clearCanvas() {
    this.canvasContext.fillRect(0, 0, this.getMinScreenDimension(), this.getMinScreenDimension());
  }

  private getMinScreenDimension(): number {
    return Math.min(this.screenHeight, this.screenWidth);
  }

  private populateCell(i: number, j: number) {
    const cellXPos = i * this.cellSize;
    const cellYPos = j * this.cellSize;
    this.canvasContext.clearRect(cellXPos, cellYPos, this.cellSize, this.cellSize);
  }

  private killCell(i: number, j: number) {
    const cellXPos = i * this.cellSize;
    const cellYPos = j * this.cellSize;
    this.canvasContext.fillRect(cellXPos, cellYPos, this.cellSize, this.cellSize);
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
