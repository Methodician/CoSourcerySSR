import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FireDetailComponent } from './fire-detail.component';

describe('FireDetailComponent', () => {
  let component: FireDetailComponent;
  let fixture: ComponentFixture<FireDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FireDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FireDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
