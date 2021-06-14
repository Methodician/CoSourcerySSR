import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CountdownDialogComponent } from './countdown-dialog.component';

describe('CountdownDialogComponent', () => {
  let component: CountdownDialogComponent;
  let fixture: ComponentFixture<CountdownDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CountdownDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CountdownDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
