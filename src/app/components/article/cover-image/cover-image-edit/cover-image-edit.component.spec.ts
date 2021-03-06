import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CoverImageEditComponent } from './cover-image-edit.component';

describe('CoverImageEditComponent', () => {
  let component: CoverImageEditComponent;
  let fixture: ComponentFixture<CoverImageEditComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CoverImageEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoverImageEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
