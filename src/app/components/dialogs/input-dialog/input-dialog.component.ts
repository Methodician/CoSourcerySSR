import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'cos-input-dialog',
  templateUrl: './input-dialog.component.html',
  styleUrls: ['./input-dialog.component.scss'],
})
export class InputDialogComponent implements OnInit {
  dialogTitle: string;
  inputPlaceholder: string;
  inputLabel: string;
  initialValue: string;

  inputValidators: ValidatorFn | ValidatorFn[];
  inputForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<InputDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    data: {
      inputLabel: string;
      initialValue: string;
      dialogTitle: string;
      inputPlaceholder: string;
      inputValidators: ValidatorFn | ValidatorFn[];
    },
  ) {
    if (!data.inputLabel || !data.initialValue) {
      this.dialogRef.close();
      throw new Error(
        `Can't use input dialog without an input label and initial value`,
      );
    }

    const {
      inputLabel,
      initialValue,
      inputValidators,
      dialogTitle,
      inputPlaceholder,
    } = data;
    this.inputLabel = inputLabel;
    this.initialValue = initialValue;
    this.inputValidators = inputValidators;
    this.dialogTitle = dialogTitle;
    this.inputPlaceholder = inputPlaceholder;
  }

  ngOnInit(): void {
    this.inputForm = this.formBuilder.group({
      input: this.initialValue,
    });

    if (this.inputValidators) {
      const inputField = this.inputForm.get('input');

      inputField.setValidators(this.inputValidators);
    }
  }

  onSubmit = () => {
    const { value, valid } = this.inputForm.get('input');

    if (!!valid) {
      this.dialogRef.close(value);
    }
  };

  onCancel = () => this.dialogRef.close(this.initialValue);

  errorText = () => {
    const { errors } = this.inputForm.get('input');
    if (!errors) {
      return;
    }

    if (errors.required) {
      return 'You must enter a value';
    }

    if (errors.minlength) {
      return `You entered ${errors.minlength.actualLength} of ${errors.minlength.requiredLength} required characters`;
    }

    if (errors.maxlength) {
      return `You entered ${
        errors.maxlength.actualLength - errors.maxlength.requiredLength
      } too many characters`;
    }

    return "something isn't right. Check value above";
  };
}
