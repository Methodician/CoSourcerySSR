import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomEditorTestComponent } from './custom-editor-test.component';

describe('CustomEditorTestComponent', () => {
  let component: CustomEditorTestComponent;
  let fixture: ComponentFixture<CustomEditorTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomEditorTestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomEditorTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
