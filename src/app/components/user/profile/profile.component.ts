import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CUserInfo, IUserInfo } from '@models/user-info';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { ISEOtags, SeoService } from '@services/seo.service';
import { UserService } from '@services/user.service';
import { BehaviorSubject, Subject, combineLatest, of } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { isEqual, cloneDeep } from 'lodash';
import { PlatformService } from '@services/platform.service';
import { StorageService } from '@services/storage.service';

@Component({
  selector: 'cos-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  @ViewChild('imageInput') imageInput: ElementRef<HTMLInputElement>;

  private unsubscribe$: Subject<void> = new Subject();

  user: CUserInfo;
  dbUser: CUserInfo;
  canEdit$ = new BehaviorSubject(false);
  activeCtrlName: CtrlNamesProfileT = 'none';
  profileImageUrl: string;
  profileImageFile: File;

  // Form emulation for save validation (seems like overkill)
  private form: FormGroup;
  private aliasValidators = Validators.maxLength(30);
  private fNameValidators = [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(12),
  ];
  private lNameValidators = [Validators.minLength(2), Validators.maxLength(15)];
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
    private storageSvc: StorageService,
    // private router: Router,
    private userSvc: UserService,
    private authSvc: AuthService,
    private seoSvc: SeoService,
    private dialogSvc: DialogService,
    private platformSvc: PlatformService,
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
    if (!this.canEdit$.value) {
      return;
    }

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
            if (!!res || res === '') {
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
            if (!!res || res === '') {
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
            if (!!res || res === '') {
              this.user.zipCode = res;
              this.form.patchValue({ zipCode: res });
            }
            const { user, form } = this;
            const hasRes = !!res || res === '';
            console.log({ res, user, form, hasRes });
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
            if (!!res || res === '') {
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
            if (!!res || res === '') {
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
            if (!!res || res === '') {
              this.user.state = res;
              this.form.patchValue({ state: res });
            }
            this.activateCtrl('none');
          });
        break;
      case 'image':
        this.openFileDialog();
        break;
      default:
        break;
    }
  };

  openFileDialog = () => {
    // TODO: Consider simplifying body image system
    // It, too, can probably use static element and maybe assume single image

    if (this.platformSvc.isServer) {
      alert('Please wait for the application to load first');
      return;
    }

    const { imageInput } = this;
    const inputEl = imageInput.nativeElement;

    inputEl.onchange = () => {
      const reader = new FileReader();

      const file = inputEl.files[0];
      this.profileImageFile = file;

      reader.onload = $e => {
        this.profileImageUrl = $e.target.result.toString();
      };
      reader.readAsDataURL(file);
    };
    inputEl.click();
  };

  saveChanges = async () => {
    const { user, profileImageFile } = this;
    if (!!this.profileImageFile) {
      const { task, ref } = this.userSvc.uploadProfileImage(
        this.authSvc.authInfo$.value.uid,
        profileImageFile,
      );
      const onTaskFulfilled = async snap => {
        console.log('task fulfilled', snap);
        if (snap.state === 'success') {
          const imageUrl = await ref.getDownloadURL().toPromise();
          user.imageUrl = imageUrl;
          await this.saveUser();
        } else {
          this.dialogSvc.openMessageDialog(
            'Problems with profile image',
            "It's weird, and we don't have a good explanation. Try again, maybe select a different image. Let us know if this continues!",
          );
        }
      };
      const onTaskRejected = err => {
        console.log('task rejected', err);
        this.dialogSvc.openMessageDialog(
          'Problems with profile image',
          "Uploading the profile image you selected didn't work. Try again, or maybe select a different image. Here's a cryptic error to share with us if this continues:",
          err.toString(),
        );
      };
      await task.then(onTaskFulfilled, onTaskRejected);
    } else {
      await this.saveUser();
    }
  };

  saveUser = async () => {
    try {
      await this.userSvc.updateUser(this.user);
    } catch (error) {
      this.dialogSvc.openMessageDialog(
        'Problems saving profile',
        "That didn't work. Here's a cryptic error message... Let us know if this continues, taking note of the error!",
        error.toString(),
      );
    }
  };

  cancelChanges = () => {
    const { dbUser, form } = this;
    this.user = cloneDeep(dbUser);
    this.profileImageFile = null;
    this.watchImageUrl(this.user.uid);
    form.patchValue({ ...dbUser });
  };

  // LONG-LIVED OBSERVABLES ETC
  watchRouteAndUser = () => {
    const user$ = this.route.params.pipe(
      map(params => params['uid']),
      tap(uid => {
        this.checkAuthAgainstUid(uid);
        this.watchImageUrl(uid);
      }),
      switchMap(uid => this.userSvc.userRef(uid).valueChanges()),
      takeUntil(this.unsubscribe$),
    );

    user$.subscribe(user => {
      this.addUserTags(user);
      this.user = new CUserInfo(user);
    });

    combineLatest([user$, this.canEdit$]).subscribe(([user, canEdit]) => {
      if (!!user && canEdit) {
        this.dbUser = new CUserInfo(cloneDeep(user));

        this.form = this.fb.group({
          alias: [user.alias, this.aliasValidators],
          fName: [user.fName, this.fNameValidators],
          lName: [user.lName, this.lNameValidators],
          zipCode: [user.zipCode, this.zipCodeValidators],
          city: [user.city, this.cityValidators],
          state: [user.state, this.stateValidators],
          bio: [user.bio, this.bioValidators],
          imageUrl: [user.imageUrl],
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

  watchImageUrl = (uid: string) => {
    this.storageSvc
      .getImageUrl(`profileImages/${uid}`)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(url => {
        this.profileImageUrl = url;
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
  wasUserEdited = () =>
    !isEqual(this.user, this.dbUser) || !!this.profileImageFile;

  saveTooltipText = () => `save ${this.user.displayName()}`;

  doesUserHaveAttr = (attrName: string) =>
    !!this.user[attrName] && this.user[attrName] !== '';
}

export type CtrlNamesProfileT =
  | 'image'
  | 'none'
  | 'fName'
  | 'lName'
  | 'alias'
  | 'bio'
  | 'city'
  | 'state'
  | 'zipCode';
