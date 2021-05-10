import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'cos-article-cta-dialog',
  templateUrl: './article-cta-dialog.component.html',
  styleUrls: ['./article-cta-dialog.component.scss'],
})
export class ArticleCtaDialogComponent {
  constructor(private dialogRef: MatDialogRef<ArticleCtaDialogComponent>) {}

  onContinue = () => this.dialogRef.close('continue');

  onLogin = () => this.dialogRef.close('login');

  onRegister = () => this.dialogRef.close('register');
}
