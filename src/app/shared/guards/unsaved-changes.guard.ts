import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { ArticleComponent } from '@components/article/article.component';
import { DialogService } from '@services/dialog.service';

@Injectable({
  providedIn: 'root',
})
export class UnsavedChangesGuard implements CanDeactivate<ArticleComponent> {
  constructor(private dialogSvc: DialogService) {}

  canDeactivate(component: ArticleComponent) {
    if (!component.isUserEditingArticle()) return true;

    const response$ = this.dialogSvc
      .openConfirmDialog(
        'Unsaved Changes',
        'Are you sure you want to leave without saving?',
        'Click "Yes" to proceed and lose changes. Click "No" to continue editing.'
      )
      .afterClosed();
    return response$;
  }
}
