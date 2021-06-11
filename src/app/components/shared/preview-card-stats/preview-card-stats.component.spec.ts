import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PreviewCardStatsComponent } from './preview-card-stats.component';

describe('PreviewCardStatsComponent', () => {
  let component: PreviewCardStatsComponent;
  let fixture: ComponentFixture<PreviewCardStatsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PreviewCardStatsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewCardStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
