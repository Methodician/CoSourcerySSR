import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthInfo } from '@models/classes/auth-info';
import { AuthService } from '@services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from '@components/modals/login-dialog/login-dialog.component';

@Component({
  selector: 'cos-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss'],
})
export class TopNavComponent implements OnInit {
  authInfo: AuthInfo;
  showMobileMenu = false;

  constructor(
    private authSvc: AuthService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.authSvc.authInfo$.subscribe(authInfo => {
      this.authInfo = authInfo;
    });
  }

  onSearch(input) {
    this.router.navigate(['search', input]);
  }

  onLogin() {
    this.dialog.open(LoginDialogComponent);
  }

  onLogout() {
    this.authSvc.logout();
  }
}
