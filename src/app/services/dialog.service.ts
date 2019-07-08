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

  openMessageDialog = (title: string, msg1: string, msg2: string = null) => {
    const dialogConfig = this.genericDialogConfig(title, msg1, msg2);
    const dialogRef = this.dialog.open(MessageDialogComponent, dialogConfig);
    return dialogRef;
  };

  // TODO: DRY these up or justify their separation...
  openConfirmDialog = (title: string, msg1: string, msg2: string = null) => {
    const dialogConfig = this.genericDialogConfig(title, msg1, msg2);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    return dialogRef;
  };

  openTimeoutDialog = () => {
    // this.dialogIsOpen.next(true);
    // const dialogConfig = new MatDialogConfig();
    // dialogConfig.disableClose = true;

    // const dialogRef = this.dialog.open(
    //   EditTimeoutDialogComponent,
    //   dialogConfig
    // );
    // dialogRef.afterClosed().subscribe(res => {
    //   // this.dialogIsOpen.next(false);
    //   const editorIsActive = res ? res : false;
    //   if (editorIsActive) {
    //     this.setEditSessionTimeout();
    //   } else {
    //     this.endEditSession();
    //   }
    // });
    return this.openConfirmDialog(
      'just for now',
      'Have not implemented openTimeoutDialog yet',
      'Need to separate concerns between component and service'
    );
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
