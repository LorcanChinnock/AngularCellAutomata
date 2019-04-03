import { TestBed } from '@angular/core/testing';

import { ChanceService } from './chance.service';

describe('ChanceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ChanceService = TestBed.get(ChanceService);
    expect(service).toBeTruthy();
  });
});
