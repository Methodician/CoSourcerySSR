import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, Subscription, interval, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'cos-countdown-dialog',
  templateUrl: './countdown-dialog.component.html',
  styleUrls: ['./countdown-dialog.component.scss'],
})
export class CountdownDialogComponent implements OnInit, OnDestroy {
  allottedSeconds = 30;
  dialogTitle = 'Just checking with you';
  countdownText: string;
  dialogLine1 = 'After the time runs out, you will lose your marbles';
  doneOption = "I'm done";
  stillWorkingOption = "I'm not ready";

  subscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<CountdownDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    data: {
      allottedSeconds: number;
      dialogTitle: string;
      dialogLine1: string;
      doneOption: string;
      stillWorkingOption: string;
    }
  ) {
    if (data.allottedSeconds) this.allottedSeconds = data.allottedSeconds;
    this.countdownText = `You have ${this.allottedSeconds} seconds to respond.`;

    if (data.dialogTitle) this.dialogTitle = data.dialogTitle;
    if (data.dialogLine1) this.dialogLine1 = data.dialogLine1;
    if (data.doneOption) this.doneOption = data.doneOption;
    if (data.stillWorkingOption)
      this.stillWorkingOption = data.stillWorkingOption;
  }

  ngOnInit() {
    this.subscription = interval(1000)
      .pipe(takeUntil(timer((this.allottedSeconds + 1) * 1000)))
      .subscribe(() => {
        this.allottedSeconds--;
        this.countdownText = `You have ${this.allottedSeconds} seconds to respond.`;
        if (this.allottedSeconds === 0) this.dialogRef.close(true);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSelectDone = () => this.dialogRef.close(true);
  onSelectStillWorking = () => this.dialogRef.close(false);
}
