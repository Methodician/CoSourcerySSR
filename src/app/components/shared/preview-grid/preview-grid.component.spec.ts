import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewGridComponent } from './preview-grid.component';

describe('PreviewGridComponent', () => {
  let component: PreviewGridComponent;
  let fixture: ComponentFixture<PreviewGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreviewGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
