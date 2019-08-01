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
  canEdit = false;
  isEditing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authSvc: AuthService
  ) {}

  ngOnInit() {
    // TODO: This can be SSR too...
    this.route.params.subscribe(params => {
      if (params['uid']) {
        this.authSvc.authInfo$.subscribe(auth => {
          if (params['uid'] === auth.uid) this.canEdit = true;
          else this.canEdit = false;
        });
      } else {
        this.isEditing = true;
      }
    });
  }

  edit = () => {
    this.router.navigate(['profile']);
  };
}
