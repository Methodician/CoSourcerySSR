import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VersionPreviewCardComponent } from './version-preview-card.component';

describe('VersionPreviewCardComponent', () => {
  let component: VersionPreviewCardComponent;
  let fixture: ComponentFixture<VersionPreviewCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VersionPreviewCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VersionPreviewCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
