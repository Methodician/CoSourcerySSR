import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { AuthInfoC } from '@models/auth-info';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from '@dialogs/login-dialog/login-dialog.component';

@Component({
  selector: 'cos-not-logged-in',
  templateUrl: './not-logged-in.component.html',
  styleUrls: ['./not-logged-in.component.scss'],
})
export class NotLoggedInComponent implements OnInit {
  redirectPath: string;
  authInfo: AuthInfoC;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private authSvc: AuthService,
  ) {}

  ngOnInit() {
    this.redirectPath = this.route.snapshot.params.redirectPath;
    this.authSvc.authInfo$.subscribe(info => (this.authInfo = info));
  }

  onSelectLogin = () => this.dialog.open(LoginDialogComponent);

  onSelectGoHome = () => this.router.navigate(['/home']);

  onSelectGoBack = () => this.router.navigate([this.redirectPath]);

  isLoggedIn = () => this.authInfo.isLoggedIn();
}
