import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TitleDisplayComponent } from './title-display.component';

describe('TitleDisplayComponent', () => {
  let component: TitleDisplayComponent;
  let fixture: ComponentFixture<TitleDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TitleDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TitleDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
