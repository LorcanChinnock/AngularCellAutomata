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
import { ChanceService } from 'app/shared/services/chanceService/chance.service';
import { TimerService } from 'app/shared/services/timer/timer.service';
import { TurnTimer } from 'app/shared/services/timer/turn-timer';
import { Point } from 'app/shared/models/point';

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
  @Input() speedInMilliseconds = 20;
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
    this.currentState = this.create2DArray(this.numberOfTiles);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.setupGame();
  }

  ngOnInit(): void {
    this.setupGame();
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

  private setupGame() {
    this.resolveScreenSize();
    this.calculateCellSize();
    this.setupCanvas();
    this.setGameFromCurrentState();
  }

  private create2DArray(length: number): number[][] {
    return new Array(length).fill(0).map(() => new Array(length).fill(0));
  }

  private resolveScreenSize() {
    this.screenHeight = window.innerHeight - 100;
    this.screenWidth = window.innerWidth - 100;
  }

  private setupTimerSubscription() {
    this.timerSubscription = this.turnTimer.timer$.subscribe(() => {
      this.updateState();
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
    if (this.getCurrentStateAtPoint(cellPoint) === 1) {
      this.killCell(cellPoint);
      this.currentState[cellPoint.x][cellPoint.y] = 0;
    } else {
      this.populateCell(cellPoint);
      this.currentState[cellPoint.x][cellPoint.y] = 1;
    }
  }

  private populateGridRandom() {
    this.clearCanvas();
    for (let x = 0; x < this.numberOfTiles; x++) {
      for (let y = 0; y < this.numberOfTiles; y++) {
        const cellPoint = new Point(x, y);
        this.currentState[cellPoint.x][cellPoint.y] = this.getOneOrZero();
        if (this.getCurrentStateAtPoint(cellPoint) === 1) {
          this.populateCell(cellPoint);
        }
      }
    }
  }

  private getOneOrZero() {
    const deadStartWeight = (100 - this.aliveStartPercentage) / this.aliveStartPercentage;
    const values = [0, 1];
    const weights = [deadStartWeight, 1];
    return this.chanceService.getWeightedRandom(values, weights);
  }

  private updateState() {
    this.clearCanvas();
    const nextState = this.create2DArray(this.numberOfTiles);
    for (let x = 0; x < this.numberOfTiles; x++) {
      for (let y = 0; y < this.numberOfTiles; y++) {
        const cellPoint = new Point(x, y);
        if (this.findNextStateWithRules(cellPoint) === 1) {
          this.populateCell(cellPoint);
          nextState[x][y] = 1;
        }
      }
    }
    this.currentState = nextState;
  }

  private setGameFromCurrentState() {
    this.clearCanvas();
    for (let x = 0; x < this.numberOfTiles; x++) {
      for (let y = 0; y < this.numberOfTiles; y++) {
        const cellPoint = new Point(x, y);
        if (this.getCurrentStateAtPoint(cellPoint)) {
          this.populateCell(cellPoint);
        }
      }
    }
  }

  private findNextStateWithRules(cellPoint: Point): number {
    if (this.getCurrentStateAtPoint(cellPoint) === 1) {
      return this.getAmountOfNeighbours(cellPoint) <= 1 || this.getAmountOfNeighbours(cellPoint) >= 4 ? 0 : 1;
    } else {
      return this.getAmountOfNeighbours(cellPoint) === 3 ? 1 : 0;
    }
  }

  private getCurrentStateAtPoint(cellPoint: Point): number {
    return this.currentState[cellPoint.x][cellPoint.y];
  }

  private clearCanvas() {
    this.canvasContext.fillRect(0, 0, this.getMinScreenDimension(), this.getMinScreenDimension());
  }

  private getMinScreenDimension(): number {
    return Math.min(this.screenHeight, this.screenWidth);
  }

  private populateCell(cellPoint: Point) {
    const cellXPos = cellPoint.x * this.cellSize;
    const cellYPos = cellPoint.y * this.cellSize;
    this.canvasContext.clearRect(cellXPos, cellYPos, this.cellSize, this.cellSize);
  }

  private killCell(cellPoint: Point) {
    const cellXPos = cellPoint.x * this.cellSize;
    const cellYPos = cellPoint.y * this.cellSize;
    this.canvasContext.fillRect(cellXPos, cellYPos, this.cellSize, this.cellSize);
  }

  private getAmountOfNeighbours(cellPoint: Point) {
    let amount = 0;
    for (let relativeX = -1; relativeX <= 1; relativeX++) {
      for (let relativeY = -1; relativeY <= 1; relativeY++) {
        const isSelf = relativeX === 0 && relativeY === 0;
        const cellPointToCheck = new Point(cellPoint.x + relativeX, cellPoint.y + relativeY);
        if (this.isWithinSimulationRange(cellPointToCheck) && !isSelf) {
          amount += this.currentState[cellPointToCheck.x][cellPointToCheck.y];
        }
      }
    }
    return amount;
  }

  private isWithinSimulationRange(cellPoint: Point) {
    return cellPoint.x >= 0 && cellPoint.x < this.numberOfTiles && cellPoint.y >= 0 && cellPoint.y < this.numberOfTiles;
  }
}
