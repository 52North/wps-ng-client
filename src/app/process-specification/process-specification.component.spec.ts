import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessSpecificationComponent } from './process-specification.component';

describe('ProcessSpecificationComponent', () => {
  let component: ProcessSpecificationComponent;
  let fixture: ComponentFixture<ProcessSpecificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProcessSpecificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessSpecificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
