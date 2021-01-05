import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { ConfirmDialogComponent } from '@dialogs/confirm-dialog/confirm-dialog.component';
import { MessageDialogComponent } from '@dialogs/message-dialog/message-dialog.component';
import { ProgressDialogComponent } from '@dialogs/progress-dialog/progress-dialog.component';
import { CountdownDialogComponent } from '@dialogs/countdown-dialog/countdown-dialog.component';
import { InputDialogComponent } from '@dialogs/input-dialog/input-dialog.component';
import { ValidatorFn } from '@angular/forms';
import { IUserInfo } from '@models/user-info';
import { ProfileEditDialogComponent } from '@dialogs/profile-edit-dialog/profile-edit-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  openProfileEditDialog = (user: IUserInfo) => {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = { user };

    const dialogRef = this.dialog.open(
      ProfileEditDialogComponent,
      dialogConfig,
    );
    return dialogRef;
  };

  // It may make sense to convert these args to object with named config params
  openInputDialog = (
    inputLabel: string,
    initialValue: string,
    inputValidators?: ValidatorFn | ValidatorFn[],
    shouldUseTextArea: boolean = false,
    dialogTitle?: string,
    inputPlaceholder?: string,
  ) => {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      inputLabel,
      initialValue,
      shouldUseTextArea,
      inputValidators,
      dialogTitle,
      inputPlaceholder,
    };

    if (shouldUseTextArea) {
      dialogConfig.height = '90vh';
      dialogConfig.width = '90vw';
    }

    const dialogRef = this.dialog.open(InputDialogComponent, dialogConfig);
    return dialogRef;
  };

  /**
   * Opens a dialog modal with the given title and messages.
   *
   * Emits generic event to the onClose() method's subscriber
   */
  openMessageDialog = (title: string, msg1: string, msg2: string = null) => {
    const dialogConfig = this.genericDialogConfig(title, msg1, msg2);
    const dialogRef = this.dialog.open(MessageDialogComponent, dialogConfig);
    return dialogRef;
  };

  // TODO: DRY these up or justify their separation...
  /**
   * Opens a dialog modal with the given title and messages.
   *
   * Emits boolean event to the onClose() method's subscriber.
   */
  openConfirmDialog = (title: string, msg1: string, msg2: string = null) => {
    const dialogConfig = this.genericDialogConfig(title, msg1, msg2);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    return dialogRef;
  };

  openTimeoutDialog = (
    allottedSeconds?: number,
    title?: string,
    msg?: string,
    doneOption?: string,
    stillWorkingOption?: string,
  ) => {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.data = {
      allottedSeconds,
      dialogTitle: title,
      dialogLine1: msg,
      doneOption,
      stillWorkingOption,
    };

    const dialogRef = this.dialog.open(CountdownDialogComponent, dialogConfig);
    return dialogRef;
  };

  /**
   * Displays the title and message, along with a progress bar.
   *
   * Progress$ must be supplied and its value should always be between 0 and 100
   *
   * Emits a boolean event to the onClose() method's subscriber (intended to determine whether to cancel the in-progress event or simply hide progress)
   */
  openProgressDialog = (
    title: string,
    msg1: string,
    progress$: Observable<number>,
  ) => {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.data = {
      dialogTitle: title,
      dialogLine1: msg1,
      progress$,
    };

    const dialogRef = this.dialog.open<ProgressDialogComponent, any, boolean>(
      ProgressDialogComponent,
      dialogConfig,
    );
    return dialogRef;
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
