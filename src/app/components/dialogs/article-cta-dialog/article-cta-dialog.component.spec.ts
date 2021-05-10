import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArticleCtaDialogComponent } from './article-cta-dialog.component';

describe('ArticleCtaDialogComponent', () => {
  let component: ArticleCtaDialogComponent;
  let fixture: ComponentFixture<ArticleCtaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArticleCtaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArticleCtaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
