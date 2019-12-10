import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VersionDetailComponent } from './version-detail.component';

describe('VersionDetailComponent', () => {
  let component: VersionDetailComponent;
  let fixture: ComponentFixture<VersionDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VersionDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VersionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
