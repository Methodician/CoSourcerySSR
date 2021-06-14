import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CoverImageDisplayComponent } from './cover-image-display.component';

describe('CoverImageDisplayComponent', () => {
  let component: CoverImageDisplayComponent;
  let fixture: ComponentFixture<CoverImageDisplayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CoverImageDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoverImageDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
