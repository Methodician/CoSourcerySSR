import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TitleDisplayComponent } from './title-display.component';

describe('TitleDisplayComponent', () => {
  let component: TitleDisplayComponent;
  let fixture: ComponentFixture<TitleDisplayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TitleDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TitleDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
