import { Component, OnInit, Input } from '@angular/core';
import { IUserInfo } from '@models/interfaces/user-info';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@services/user.service';
import { AuthService } from '@services/auth.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'cos-profile-display',
  templateUrl: './profile-display.component.html',
  styleUrls: ['./profile-display.component.scss'],
})
export class ProfileDisplayComponent implements OnInit {
  user: IUserInfo;
  canEdit = false;

  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userSvc: UserService,
    private authSvc: AuthService
  ) {}

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe)).subscribe(params => {
      if (params['uid']) {
        const uid = params['uid'];
        this.watchUser(uid);
        this.authSvc.authInfo$
          .pipe(takeUntil(this.unsubscribe))
          .subscribe(auth => {
            if (uid === auth.uid) this.canEdit = true;
            else this.canEdit = false;
          });
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  watchUser = (uid: string) => {
    this.userSvc
      .userRef(uid)
      .valueChanges()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(user => (this.user = user));
  };

  edit = () => {
    this.router.navigate(['profile']);
  };
}
