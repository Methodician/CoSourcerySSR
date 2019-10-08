import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs';
import { startWith, takeWhile, tap } from 'rxjs/operators';

@Component({
  selector: 'cos-progress-dialog',
  templateUrl: './progress-dialog.component.html',
  styleUrls: ['./progress-dialog.component.scss'],
})
export class ProgressDialogComponent implements OnInit {
  dialogTitle: string;
  dialogLine1: string;
  progress$: Observable<number>;

  progress: number;

  constructor(
    private dialogRef: MatDialogRef<ProgressDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    data: {
      dialogTitle: string;
      dialogLine1: string;
      progress$: Observable<number>;
    }
  ) {
    if (!data.progress$) {
      this.dialogRef.close();
      throw 'Can not use progress dialog without progress';
    }
    this.dialogTitle = data.dialogTitle ? data.dialogTitle : 'Progress';
    this.dialogLine1 = data.dialogLine1
      ? data.dialogLine1
      : 'When the bar is full, progress is complete.';
    this.progress$ = data.progress$;
  }

  ngOnInit() {
    this.progress$
      .pipe(
        startWith(0),
        takeWhile(val => val <= 100),
        tap(progress => {
          if (progress >= 100) this.dialogRef.close(false);
        })
      )
      .subscribe(progress => {
        this.progress = progress;
      });
  }

  onSelectHide = () => this.dialogRef.close(false);

  onSelectCancel = () => this.dialogRef.close(true);
}
