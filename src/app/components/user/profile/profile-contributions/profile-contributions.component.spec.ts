import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProfileContributionsComponent } from './profile-contributions.component';

describe('ProfileContributionsComponent', () => {
  let component: ProfileContributionsComponent;
  let fixture: ComponentFixture<ProfileContributionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProfileContributionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileContributionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
