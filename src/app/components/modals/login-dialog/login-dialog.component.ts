import { Component } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'cos-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss'],
})
export class LoginDialogComponent {
  loginForm: FormGroup;
  loginError: string = null;

  constructor(
    private authSvc: AuthService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<LoginDialogComponent>,
  ) {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onLogIn() {
    this.loginError = null;
    const val = this.loginForm.value;
    this.authSvc
      .login(val.email, val.password)
      .then(() => {
        this.dialogRef.close();
      })
      .catch(err => {
        this.handleLoginError(err);
      });
  }

  handleLoginError(err) {
    switch (err.code) {
      case 'auth/user-not-found':
        this.loginError =
          "We couldn't find your account. Check your email for typos and try again or create an account.";
        break;
      case 'auth/invalid-email':
        this.loginError =
          "That doesn't look like a real email. Please try again or create an account.";
        break;
      case 'auth/wrong-password':
        this.loginError =
          "The password you entered doesn't match our records. If you forgot your password please contact info@flight.run.";
        break;
      default:
        this.loginError =
          "There was a problem logging in. We're not sure what happened. If you're sure hou have an account please contact info@flight.run";
        break;
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
