import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BodyEditComponent } from './body-edit.component';

describe('BodyEditComponent', () => {
  let component: BodyEditComponent;
  let fixture: ComponentFixture<BodyEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BodyEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BodyEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
