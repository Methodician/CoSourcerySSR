import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'cos-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.scss'],
})
export class MessageDialogComponent {
  dialogTitle: string;
  dialogLine1: string;
  dialogLine2: string;

  constructor(
    private dialogRef: MatDialogRef<MessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    data: {
      dialogTitle: string;
      dialogLine1: string;
      dialogLine2: string;
    }
  ) {
    this.dialogTitle = data.dialogTitle ? data.dialogTitle : 'Message Title';
    this.dialogLine1 = data.dialogLine1 ? data.dialogLine1 : 'Message Line 1';
    this.dialogLine2 = data.dialogLine2 ? data.dialogLine2 : null;
  }

  onConfirm = () => {
    this.dialogRef.close();
  };
}
