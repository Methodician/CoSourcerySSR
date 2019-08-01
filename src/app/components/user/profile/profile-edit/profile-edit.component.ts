import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserInfo } from '@models/interfaces/user-info';

@Component({
  selector: 'cos-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss'],
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  @Input() formUser;
  @Input() imageUploadPercent$: Observable<number>;
  @Output() profileImageSelected = new EventEmitter<string>();

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    if (this.formUser) {
      this.profileForm = this.fb.group({
        alias: [this.formUser.alias, Validators.maxLength(30)],
        fName: [
          this.formUser.fName,
          [Validators.required, Validators.maxLength(30)],
        ],
        lName: [
          this.formUser.lName,
          [Validators.required, Validators.maxLength(30)],
        ],
        uid: [this.formUser.uid, Validators.required],
        imageUrl: this.formUser.imageUrl,
        email: [
          this.formUser.email,
          [Validators.required, Validators.email, Validators.maxLength(50)],
        ],
        zipCode: [this.formUser.zipCode, Validators.maxLength(5)],
        bio: [this.formUser.bio, Validators.maxLength(500)],
        city: [this.formUser.city, Validators.maxLength(30)],
        state: [this.formUser.state, Validators.maxLength(2)],
      });
    }
  }

  trmInput = formControlName => {
    this.profileForm.patchValue({
      [formControlName]: this.profileForm.value[formControlName].trim(),
    });
  };

  onSelectProfileImage = $event => {
    this.profileImageSelected.emit($event);
  };

  get valid() {
    return this.profileForm.valid;
  }

  get pristine() {
    return this.profileForm.pristine;
  }

  get user(): UserInfo {
    return this.profileForm.value;
  }
}
