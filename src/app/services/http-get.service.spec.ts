import { TestBed } from '@angular/core/testing';

import { HttpGetService } from './http-get.service';

describe('HttpGetService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: HttpGetService = TestBed.get(HttpGetService);
    expect(service).toBeTruthy();
  });
});
