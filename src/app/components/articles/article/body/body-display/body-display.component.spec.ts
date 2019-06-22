import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BodyDisplayComponent } from './body-display.component';

describe('BodyDisplayComponent', () => {
  let component: BodyDisplayComponent;
  let fixture: ComponentFixture<BodyDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BodyDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BodyDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
