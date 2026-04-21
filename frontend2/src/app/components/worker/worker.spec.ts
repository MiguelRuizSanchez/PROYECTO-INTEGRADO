import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Worker } from './worker';

describe('Worker', () => {
  let component: Worker;
  let fixture: ComponentFixture<Worker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Worker],
    }).compileComponents();

    fixture = TestBed.createComponent(Worker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
