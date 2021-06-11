import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotLoggedInComponent } from './not-logged-in.component';

describe('NotLoggedInComponent', () => {
  let component: NotLoggedInComponent;
  let fixture: ComponentFixture<NotLoggedInComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotLoggedInComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotLoggedInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
