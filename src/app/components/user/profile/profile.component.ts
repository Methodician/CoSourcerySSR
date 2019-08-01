import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@services/user.service';
import { Observable } from 'rxjs';
import { UserInfo } from '@models/interfaces/user-info';
import { filter } from 'rxjs/operators';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'cos-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  uid: string;
  loggedInUid: string;
  user$: Observable<UserInfo>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userSvc: UserService,
    private authSvc: AuthService
  ) {}

  ngOnInit() {
    // TODO: This can be SSR too...
    this.authSvc.authInfo$.subscribe(auth => {
      this.loggedInUid = auth.uid;
      if (!this.uid) this.uid = auth.uid;
    });
    this.route.params.subscribe(params => {
      if (params['uid']) {
        this.uid = params['uid'];
        this.watchUser();
      }
    });
  }

  watchUser = () => {
    this.user$ = this.userSvc.userRef(this.uid).valueChanges();
  };

  edit = () => {
    this.router.navigate(['profile']);
  };

  isDisplayingLoggedInUser = () => this.loggedInUid === this.uid;
}
