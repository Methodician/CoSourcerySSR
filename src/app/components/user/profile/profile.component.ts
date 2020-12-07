import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CUserInfo, IUserInfo } from '@models/user-info';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { ISEOtags, SeoService } from '@services/seo.service';
import { UserService } from '@services/user.service';
import { Subject } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'cos-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private unsubscribe$: Subject<void> = new Subject();

  user: IUserInfo;
  canEdit = false;
  activeCtrlName: CtrlNamesProfileT = 'none';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userSvc: UserService,
    private authSvc: AuthService,
    private seoSvc: SeoService,
    private dialogSvc: DialogService,
  ) {}

  ngOnInit(): void {
    this.watchRouteAndUser();
    this.dialogSvc
      .openInputDialog('Enter first name', 'test', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(7),
      ])
      .afterClosed()
      .subscribe(console.log);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // EDITING
  isCtrlActive = (ctrlName: CtrlNamesProfileT) =>
    this.activeCtrlName === ctrlName;

  toggleCtrl = (ctrlName: CtrlNamesProfileT) => {
    if (this.isCtrlActive(ctrlName)) this.activeCtrlName = 'none';
    else this.activateCtrl(ctrlName);
  };

  activateCtrl = (ctrlName: CtrlNamesProfileT) => {
    if (this.authSvc.authInfo$.value.uid === this.user.uid)
      this.activeCtrlName = ctrlName;
    else
      throw new Error(
        `A user with uid ${this.authSvc.authInfo$.value.uid} is attempting to edit another user\'s profile (their uid is ${this.user.uid})`,
      );
  };

  watchRouteAndUser = () => {
    this.route.params
      .pipe(
        map(params => params['uid']),
        switchMap(uid => this.userSvc.userRef(uid).valueChanges()),
        tap(user => this.checkAuthAgainstUid(user.uid)),
        takeUntil(this.unsubscribe$),
      )
      .subscribe(user => {
        this.addUserTags(user);
        this.user = user;
      });
  };

  checkAuthAgainstUid = (uid: string) => {
    this.authSvc.authInfo$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(authInfo => {
        if (uid === authInfo.uid) {
          this.canEdit = true;
        } else this.canEdit = false;
      });
  };

  addUserTags = (userObject: IUserInfo) => {
    const user = new CUserInfo(userObject);
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
}

export type CtrlNamesProfileT =
  | 'none'
  | 'fName'
  | 'lName'
  | 'alias'
  | 'bio'
  | 'city'
  | 'state'
  | 'zipCode';
