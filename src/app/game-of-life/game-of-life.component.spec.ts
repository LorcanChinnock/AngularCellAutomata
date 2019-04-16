import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameOfLifeComponent } from './game-of-life.component';
import { FormsModule } from '@angular/forms';

describe('GameOfLifeComponent', () => {
  let component: GameOfLifeComponent;
  let fixture: ComponentFixture<GameOfLifeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [GameOfLifeComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameOfLifeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
