import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IUserInfo } from '@models/user-info';

@Component({
  selector: 'cos-profile-edit-dialog',
  templateUrl: './profile-edit-dialog.component.html',
  styleUrls: ['./profile-edit-dialog.component.scss'],
})
export class ProfileEditDialogComponent implements OnInit {
  form: FormGroup;
  user: IUserInfo;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProfileEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { user: IUserInfo },
  ) {
    this.user = data.user;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      alias: [this.user.alias, Validators.maxLength(30)],
      bio: this.user.bio,
      city: [this.user.city, Validators.maxLength(100)],
      state: [this.user.state, Validators.maxLength(2)],
      email: this.user.email,
      imageUrl: this.user.imageUrl,
      uid: this.user.uid,
      zipCode: [this.user.zipCode, Validators.maxLength(5)],
      fName: [
        this.user.fName,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(15),
        ],
      ],
      lName: [
        this.user.lName,
        [Validators.minLength(2), Validators.maxLength(20)],
      ],
    });
  }

  onSubmit = () => {
    const { valid, value } = this.form;
    if (!!valid) {
      this.dialogRef.close(value);
    }
  };
  onCancel = () => this.dialogRef.close(this.user);

  errorText = () => 'Some error';
}
