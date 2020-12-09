import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CUserInfo, IUserInfo } from '@models/user-info';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { ISEOtags, SeoService } from '@services/seo.service';
import { UserService } from '@services/user.service';
import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { isEqual, cloneDeep } from 'lodash';

@Component({
  selector: 'cos-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private unsubscribe$: Subject<void> = new Subject();

  user: IUserInfo;
  dbUser: IUserInfo;
  canEdit$ = new BehaviorSubject(false);
  activeCtrlName: CtrlNamesProfileT = 'none';

  // Form emulation for save validation (seems like overkill)
  private form: FormGroup;
  private aliasValidators = Validators.maxLength(30);
  private fNameValidators = [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(12),
  ];
  private lNameValidators = [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(15),
  ];
  // private uidValidators = Validators.required;
  // private emailValidators = [
  //   Validators.required,
  //   Validators.email,
  //   Validators.maxLength(50),
  // ];
  private zipCodeValidators = Validators.maxLength(5);
  private bioValidators = Validators.maxLength(500);
  private cityValidators = Validators.maxLength(30);
  private stateValidators = Validators.maxLength(2);

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    // private router: Router,
    private userSvc: UserService,
    private authSvc: AuthService,
    private seoSvc: SeoService,
    private dialogSvc: DialogService,
  ) {}

  ngOnInit(): void {
    this.watchRouteAndUser();
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

    switch (ctrlName) {
      case 'fName':
        this.dialogSvc
          .openInputDialog(
            'Enter first name',
            this.user.fName,
            this.fNameValidators,
          )
          .afterClosed()
          .subscribe(res => {
            if (res) {
              this.user.fName = res;
              this.form.patchValue({ fName: res });
            }
            this.activateCtrl('none');
          });
        break;
      case 'lName':
        this.dialogSvc
          .openInputDialog(
            'Enter last name',
            this.user.lName,
            this.lNameValidators,
          )
          .afterClosed()
          .subscribe(res => {
            if (res) {
              this.user.lName = res;
              this.form.patchValue({ lName: res });
            }
            this.activateCtrl('none');
          });
        break;
      case 'alias':
        this.dialogSvc
          .openInputDialog('Enter alias', this.user.alias, this.aliasValidators)
          .afterClosed()
          .subscribe(res => {
            if (res) {
              this.user.alias = res;
              this.form.patchValue({ alias: res });
            }
            this.activateCtrl('none');
          });
        break;
      case 'zipCode':
        this.dialogSvc
          .openInputDialog(
            'Enter zip code',
            this.user.zipCode,
            this.zipCodeValidators,
          )
          .afterClosed()
          .subscribe(res => {
            if (res) {
              this.user.zipCode = res;
              this.form.patchValue({ zipCode: res });
            }
            this.activateCtrl('none');
          });
        break;
      case 'bio':
        this.dialogSvc
          .openInputDialog(
            'Edit your bio',
            this.user.bio,
            this.bioValidators,
            true,
          )
          .afterClosed()
          .subscribe(res => {
            if (res) {
              this.user.bio = res;
              this.form.patchValue({ bio: res });
            }
            this.activateCtrl('none');
          });
        break;
      case 'city':
        this.dialogSvc
          .openInputDialog(
            'Enter city name',
            this.user.city,
            this.cityValidators,
          )
          .afterClosed()
          .subscribe(res => {
            if (res) {
              this.user.city = res;
              this.form.patchValue({ city: res });
            }
            this.activateCtrl('none');
          });
        break;
      case 'state':
        this.dialogSvc
          .openInputDialog(
            'Enter two-character state code',
            this.user.state,
            this.stateValidators,
          )
          .afterClosed()
          .subscribe(res => {
            if (res) {
              this.user.state = res;
              this.form.patchValue({ state: res });
            }
            this.activateCtrl('none');
          });
        break;
      default:
        break;
    }
  };

  saveChanges = () => {
    const { user, dbUser, form } = this;
    console.log({ user, dbUser, form });
  };

  cancelChanges = () => {
    const { user, dbUser, form } = this;
    this.user = dbUser;
    this.form.patchValue({ ...dbUser });
    console.log({ user, dbUser, form });
  };

  // LONG-LIVED OBSERVABLES ETC
  watchRouteAndUser = () => {
    const user$ = this.route.params.pipe(
      map(params => params['uid']),
      tap(uid => this.checkAuthAgainstUid(uid)),
      switchMap(uid => this.userSvc.userRef(uid).valueChanges()),
      takeUntil(this.unsubscribe$),
    );

    user$.subscribe(user => {
      this.addUserTags(user);
      this.user = user;
    });

    combineLatest([user$, this.canEdit$]).subscribe(([user, canEdit]) => {
      if (!!user && canEdit) {
        this.dbUser = cloneDeep(user);
        this.form = this.fb.group({
          alias: [user.alias, this.aliasValidators],
          fName: [user.fName, this.fNameValidators],
          lName: [user.lName, this.lNameValidators],
          zipCode: [user.zipCode, this.zipCodeValidators],
          city: [user.city, this.cityValidators],
          state: [user.state, this.stateValidators],
          bio: [user.bio, this.bioValidators],
        });
      }
    });
  };

  checkAuthAgainstUid = (uid: string) => {
    this.authSvc.authInfo$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(authInfo => {
        if (uid === authInfo.uid) {
          this.canEdit$.next(true);
        } else this.canEdit$.next(false);
      });
  };

  // META
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

  // HELPERS
  wasUserEdited = () => !isEqual(this.user, this.dbUser);
  // wasUserEdited = () => false;

  saveTooltipText = () => `save ${this.user.alias}`;
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
