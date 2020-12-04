import { Component, OnInit } from '@angular/core';
import { CUserInfo } from '@models/user-info';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@services/user.service';
import { AuthService } from '@services/auth.service';
import { takeUntil, tap } from 'rxjs/operators';
import { SeoService, ISEOtags } from '@services/seo.service';

@Component({
  selector: 'cos-profile-display',
  templateUrl: './profile-display.component.html',
  styleUrls: ['./profile-display.component.scss'],
})
export class ProfileDisplayComponent implements OnInit {
  user: CUserInfo;
  canEdit = false;

  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userSvc: UserService,
    private authSvc: AuthService,
    private seoSvc: SeoService,
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
      .subscribe(user => {
        if (!user) return;
        const cUser = new CUserInfo({ ...user, uid });
        this.addUserTags(cUser);
        this.user = cUser;
      });
  };

  addUserTags = (user: CUserInfo) => {
    const name = user.displayName();
    const imageUrl = user.displayImageUrl();
    const { bio, city, state, alias, fName, lName } = user;
    const title = `CoSourcery - ${name}'s Profile`;
    let description = name;
    let fromPlace = '';
    if (city || state) fromPlace += ' from';
    if (city) {
      fromPlace += ` ${city}`;
      if (state) fromPlace += ',';
    }
    if (state) fromPlace += ` ${state}`;
    description += fromPlace;
    if (bio) {
      description += ` | ${bio}`;
    }
    let keywords = name;
    if (alias && name !== alias) keywords += `, ${alias}`;
    if (fName && name !== fName) keywords += `, ${fName}`;
    if (lName) keywords += `, ${lName}`;
    if (city) keywords += `, ${city}`;
    if (state) keywords += `, ${state}`;
    const tags: ISEOtags = { title, description, imageUrl, keywords };
    this.seoSvc.generateTags(tags);
  };

  edit = () => {
    this.router.navigate(['profile']);
  };
}
