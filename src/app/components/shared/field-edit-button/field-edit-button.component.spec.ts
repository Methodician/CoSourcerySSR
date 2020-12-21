import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldEditButtonComponent } from './field-edit-button.component';

describe('FieldEditButtonComponent', () => {
  let component: FieldEditButtonComponent;
  let fixture: ComponentFixture<FieldEditButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FieldEditButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldEditButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
