import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ArticleHistoryComponent } from './article-history.component';

describe('ArticleHistoryComponent', () => {
  let component: ArticleHistoryComponent;
  let fixture: ComponentFixture<ArticleHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ArticleHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArticleHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
