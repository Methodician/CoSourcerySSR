import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserInfo } from '@models/interfaces/user-info';
import { AuthService } from '@services/auth.service';
import { UserService } from '@services/user.service';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { AngularFireUploadTask } from '@angular/fire/storage';

@Component({
  selector: 'cos-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss'],
})
export class ProfileEditComponent implements OnInit {
  // @Input() imageUploadPercent$: Observable<number>;
  // @Output() profileImageSelected = new EventEmitter<string>();

  form: FormGroup;
  imageUploadTask: AngularFireUploadTask;
  imageUploadPercent$: Observable<number>;

  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private fb: FormBuilder,
    private userSvc: UserService,
    private authSvc: AuthService
  ) {}

  ngOnInit() {
    this.authSvc
      .isSignedInOrPrompt()
      .pipe(
        switchMap(isSignedIn => {
          if (!isSignedIn) return of(null);
          return this.userSvc.loggedInUser$;
        })
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(user => {
        this.form = this.fb.group({
          alias: [user.alias, Validators.maxLength(30)],
          fName: [user.fName, [Validators.required, Validators.maxLength(30)]],
          lName: [user.lName, [Validators.required, Validators.maxLength(30)]],
          uid: [user.uid, Validators.required],
          imageUrl: user.imageUrl,
          email: [
            user.email,
            [Validators.required, Validators.email, Validators.maxLength(50)],
          ],
          zipCode: [user.zipCode, Validators.maxLength(5)],
          bio: [user.bio, Validators.maxLength(500)],
          city: [user.city, Validators.maxLength(30)],
          state: [user.state, Validators.maxLength(2)],
        });
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  trimInput = formControlName => {
    this.form.patchValue({
      [formControlName]: this.form.value[formControlName].trim(),
    });
  };

  // onSelectProfileImage = $event => {
  //   this.profileImageSelected.emit($event);
  // };

  // get valid() {
  //   return this.form.valid;
  // }

  // get pristine() {
  //   return this.form.pristine;
  // }

  // get user(): UserInfo {
  //   return this.form.value;
  // }
}
