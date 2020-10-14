import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { UserService } from '@services/user.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MessageDialogComponent } from '@dialogs/message-dialog/message-dialog.component';

@Component({
  selector: 'cos-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  currentLogin: string;
  registerForm: FormGroup;
  registerError: string = null;

  constructor(
    private router: Router,
    private authSvc: AuthService,
    private userSvc: UserService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.registerForm = this.fb.group(
      {
        email: [
          '',
          [Validators.required, Validators.email, Validators.maxLength(50)],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(30),
          ],
        ],
        confirmPass: ['', Validators.required],
        fName: ['', [Validators.required, Validators.maxLength(30)]],
        lName: ['', [Validators.required, Validators.maxLength(30)]],
        alias: ['', Validators.maxLength(30)],
        imageUrl: '',
        bio: '',
        city: '',
        state: '',
        zipCode: '',
      },
      { validator: passwordMismatch }
    );
  }

  ngOnInit() {
    this.authSvc.authInfo$.subscribe(userData => {
      this.currentLogin = userData.email;
    });
  }

  onLogOut() {
    this.authSvc.logout();
  }

  async register() {
    this.registerError = null;
    const val = this.registerForm.value;
    try {
      const res = await this.authSvc.register(val.email, val.password);
      this.openMessageDialog(
        'Successful Registration',
        'Thanks for creating an account!',
        "Play nice, make friends, and contribute to the wealth of knowledge we're building together."
      );
      delete val.password;
      delete val.confirmPass;
      this.authSvc.sendVerificationEmail();
      this.createNewUser(val, res.user.uid);
    } catch (err) {
      this.registerError = err;
    }
  }

  async createNewUser(formValue, userId: string) {
    try {
      await this.userSvc.createUser(formValue, userId);
      this.router.navigate(['profile']);
    } catch (err) {
      this.openMessageDialog(
        'Registration Error',
        'Oops! We might not have saved your user info quite right.',
        `Error: ${err}`
      );
    }
  }

  trimInput(formControlName) {
    this.registerForm.patchValue({
      [formControlName]: this.registerForm.value[formControlName].trim(),
    });
  }

  openMessageDialog(title: string, msg1: string, msg2: string = null) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.data = {
      dialogTitle: title ? title : null,
      dialogLine1: msg1 ? msg1 : null,
      dialogLine2: msg2 ? msg2 : null,
    };
    return this.dialog.open(MessageDialogComponent, dialogConfig);
  }
}

// Custom Validator
export const passwordMismatch: ValidatorFn = (
  formGroup: FormGroup
): ValidationErrors | null => {
  const password = formGroup.get('password').value;
  const retypedPassword = formGroup.get('confirmPass').value;
  return password !== retypedPassword ? { passwordMismatch: true } : null;
};
