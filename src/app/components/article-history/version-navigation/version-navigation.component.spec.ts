import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VersionNavigationComponent } from './version-navigation.component';

describe('VersionNavigationComponent', () => {
  let component: VersionNavigationComponent;
  let fixture: ComponentFixture<VersionNavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VersionNavigationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VersionNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
