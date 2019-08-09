import { Component, OnInit } from '@angular/core';
import { of, Subject, BehaviorSubject } from 'rxjs';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '@services/auth.service';
import { UserService } from '@services/user.service';
import { switchMap, take, takeUntil, map } from 'rxjs/operators';
import { AngularFireUploadTask } from '@angular/fire/storage';
import { IHtmlInputEvent } from '@models/shared';
import { DialogService } from '@services/dialog.service';
import { Router } from '@angular/router';

@Component({
  selector: 'cos-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss'],
})
export class ProfileEditComponent implements OnInit {
  form: FormGroup;
  profileImageFile: File;
  imageUploadTask: AngularFireUploadTask;

  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userSvc: UserService,
    private authSvc: AuthService,
    private dialogSvc: DialogService
  ) {}

  ngOnInit() {
    this.userSvc.loggedInUser$
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
        this.authSvc.authInfo$
          .pipe(takeUntil(this.unsubscribe))
          .subscribe(auth => {
            this.form.patchValue({ uid: auth.uid });
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

  onSelectProfileImage = (e: IHtmlInputEvent) => {
    const reader = new FileReader();
    reader.onload = () => {
      this.form.markAsDirty();
      this.form.patchValue({ imageUrl: reader.result });
    };

    const file = e.target.files[0];
    reader.readAsDataURL(file);
    this.profileImageFile = file;
  };

  saveProfileImage = (uid: string) => {
    const isComplete$ = new BehaviorSubject(false);
    if (!this.profileImageFile) {
      isComplete$.next(true);
    } else {
      try {
        const { task, ref } = this.userSvc.uploadProfileImage(
          uid,
          this.profileImageFile
        );
        this.imageUploadTask = task;
        task.then(() => {
          ref.getDownloadURL().subscribe(imageUrl => {
            this.form.patchValue({ imageUrl });
            isComplete$.next(true);
          });
        });

        this.dialogSvc
          .openProgressDialog(
            'Uploading profile image',
            'You can hide this dialog while you wait, or cancel the upload to go back to editing',
            task.percentageChanges()
          )
          .afterClosed()
          .subscribe(shouldCancel => {
            if (shouldCancel && this.imageUploadTask) {
              this.imageUploadTask.cancel();
              this.form.markAsDirty();
              isComplete$.next(false);
            }
          });
      } catch (error) {
        console.error(error);
        isComplete$.next(false);
      }
    }
    return isComplete$;
  };

  saveChanges = () => {
    this.authSvc
      .isSignedInOrPrompt()
      .pipe(
        switchMap(isSignedIn => {
          if (!isSignedIn) return of(null);
          return this.authSvc.authInfo$.pipe(map(info => info.uid));
        }),
        take(1)
      )
      .subscribe((uid: string | null) => {
        if (!uid || uid !== this.form.value.uid) {
          this.dialogSvc.openMessageDialog(
            'Must be signed in',
            'You can not save changes without being signed in as the user you are editing'
          );
          return;
        }
        const profileImageSub = this.saveProfileImage(uid).subscribe(
          async isReady => {
            if (!isReady) return;
            try {
              await this.userSvc.updateUser(this.form.value);
              this.router.navigate([`profile/${uid}`]);
            } catch (error) {
              this.dialogSvc.openMessageDialog(
                'Error saving changes',
                'Attempting to save your profile changes returned the following error',
                error.message || error
              );
            } finally {
              if (profileImageSub) profileImageSub.unsubscribe();
              return;
            }
          }
        );
      });
  };
}
