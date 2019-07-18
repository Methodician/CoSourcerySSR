import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveUndoFlagComponent } from './save-undo-flag.component';

describe('SaveUndoFlagComponent', () => {
  let component: SaveUndoFlagComponent;
  let fixture: ComponentFixture<SaveUndoFlagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaveUndoFlagComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveUndoFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
