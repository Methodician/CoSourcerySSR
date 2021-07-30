import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { IntroDisplayComponent } from './intro-display.component';

describe('IntroDisplayComponent', () => {
  let component: IntroDisplayComponent;
  let fixture: ComponentFixture<IntroDisplayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ IntroDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntroDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
