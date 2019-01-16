import { TestBed } from '@angular/core/testing';

import { RawWpsService } from './raw-wps.service';

describe('RawWpsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RawWpsService = TestBed.get(RawWpsService);
    expect(service).toBeTruthy();
  });
});
