import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { ConfirmDialogComponent } from '@modals/confirm-dialog/confirm-dialog.component';
import { MessageDialogComponent } from '@modals/message-dialog/message-dialog.component';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  // Dialog Helpers
  openMessageDialog = (title: string, msg1: string, msg2: string = null) => {
    const dialogConfig = this.genericDialogConfig(title, msg1, msg2);
    return this.dialog.open(MessageDialogComponent, dialogConfig);
  };

  openConfirmDialog = (title: string, msg1: string, msg2: string = null) => {
    const dialogConfig = this.genericDialogConfig(title, msg1, msg2);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    return dialogRef.afterClosed();
  };

  genericDialogConfig = (title: string, msg1: string, msg2: string = null) => {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.data = {
      dialogTitle: title ? title : null,
      dialogLine1: msg1 ? msg1 : null,
      dialogLine2: msg2 ? msg2 : null,
    };

    return dialogConfig;
  };
}
