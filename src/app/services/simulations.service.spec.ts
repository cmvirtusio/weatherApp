import { TestBed } from '@angular/core/testing';

import { SimulationsService } from './simulations.service';

describe('SimulationsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SimulationsService = TestBed.get(SimulationsService);
    expect(service).toBeTruthy();
  });
});
