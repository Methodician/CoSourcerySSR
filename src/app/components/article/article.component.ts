import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireUploadTask } from '@angular/fire/storage';
import { ActivatedRoute, Router } from '@angular/router';

import {
  Subscription,
  BehaviorSubject,
  Observable,
  Subject,
  timer,
  of,
} from 'rxjs';
import {
  tap,
  map,
  startWith,
  switchMap,
  takeUntil,
  take,
} from 'rxjs/operators';

// SERVICES
import { ArticleService } from '@services/article.service';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { UserService } from '@services/user.service';

import { fsTimestampNow } from '@helpers/firebase';

// MODELS
import { IArticleDetail } from '@models/article-info';
import { CUserInfo } from '@models/user-info';
import { SeoService } from '@services/seo.service';

const ARTICLE_STATE_KEY = makeStateKey<BehaviorSubject<IArticleDetail>>(
  'articleState',
);

@Component({
  selector: 'cos-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent implements OnInit, OnDestroy {
  // TODO: Consider switch to static: false https://angular.io/guide/static-query-migration
  @ViewChild('formBoundingBox', { static: false }) formBoundingBox;

  private unsubscribe: Subject<void> = new Subject();
  loggedInUser = new CUserInfo({ fName: null, lName: null });

  //  // Cover Image State
  coverImageFile: File;

  coverImageUploadTask: AngularFireUploadTask;

  // Article State
  articleId: string;
  isArticleNew: boolean;
  articleSubscription: Subscription;
  currentArticleEditors = {};

  // Article Form State
  editSessionTimeoutSubscription: Subscription;

  articleEditForm: FormGroup = this.fb.group({
    articleId: '',
    authorId: '',
    title: ['', [Validators.required, Validators.maxLength(100)]],
    introduction: ['', [Validators.required, Validators.maxLength(300)]],
    body: 'This article is empty.',
    bodyImages: {},
    imageUrl: '',
    imageAlt: ['', Validators.maxLength(100)],
    authorImageUrl: '',
    lastUpdated: null,
    timestamp: 0,
    lastEditorId: '',
    version: 1,
    commentCount: 0,
    viewCount: 0,
    slug: '',
    tags: [[], Validators.maxLength(25)],
    isFeatured: false,
    editors: {},
  });

  articleState: IArticleDetail;

  ECtrlNames = ECtrlNames; // Enum Availability in HTML Template
  ctrlBeingEdited: ECtrlNames = ECtrlNames.none;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private state: TransferState,
    private articleSvc: ArticleService,
    private userSvc: UserService,
    private authSvc: AuthService,
    private dialogSvc: DialogService,
    private seoSvc: SeoService,
  ) {
    this.userSvc.loggedInUser$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(user => {
        this.loggedInUser = user;
      });
  }

  ngOnInit() {
    this.initializeArticleIdAndState();
    this.watchFormChanges();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.updateUserEditingStatus(false);
    this.state.set(ARTICLE_STATE_KEY, null);
    this.cancelUpload(this.coverImageUploadTask);
  }

  cancelUpload = (task: AngularFireUploadTask) => {
    if (task) task.cancel();
  };

  // FORM SETUP & BREAKDOWN
  initializeArticleIdAndState = () => {
    const article$ = this.watchArticleIdAndStatus$().pipe(
      tap(({ id, isNew }) => {
        if (id) this.articleId = id;
        if (isNew) {
          this.isArticleNew = true;
        } else this.isArticleNew = false;
      }),
      switchMap(
        ({ id, isNew }): Observable<IArticleDetail> => {
          if (isNew) {
            return Observable.create(observer => {
              observer.next(this.articleEditForm.value);
              observer.complete();
            });
          } else return this.watchArticle$(id);
        },
      ),
    );
    article$.pipe(takeUntil(this.unsubscribe)).subscribe(article => {
      this.articleState = article;
      if (article) {
        this.articleEditForm.patchValue(article);
        this.updateMetaTags(article);
      }
    });
  };

  watchArticleIdAndStatus$: () => Observable<{
    id: any;
    isNew: boolean;
  }> = () => {
    return this.route.params.pipe(
      switchMap(params => {
        let status$ = of({ id: null, isNew: false });
        if (params['id'])
          status$ = this.articleSvc
            .getIdFromSlugOrId(params['id'])
            .pipe(map(id => ({ id, isNew: false })));
        else
          status$ = of({ id: this.articleSvc.createArticleId(), isNew: true });
        status$.pipe(takeUntil(this.unsubscribe)).subscribe(status => {
          if (!!status.id) {
            this.watchArticleEditors(status.id);
          }
        });
        return status$;
      }),
    );
  };

  watchArticle$ = id => {
    const preExisting: IArticleDetail = this.state.get(
      ARTICLE_STATE_KEY,
      null as any,
    );
    const article$ = this.articleSvc
      .articleDetailRef(id)
      .valueChanges()
      .pipe(
        map(article =>
          article
            ? (this.articleSvc.processArticleTimestamps(
                article,
              ) as IArticleDetail)
            : null,
        ),
        tap(article => this.state.set(ARTICLE_STATE_KEY, article)),
        startWith(preExisting),
      );
    return article$;
  };

  watchArticleEditors = id => {
    this.articleSvc
      .currentEditorsRef(id)
      .snapshotChanges()
      .pipe(
        map(snapList => snapList.map(snap => snap.key)),
        takeUntil(this.unsubscribe),
      )
      .subscribe(keys => {
        const currentEditors = {};
        for (let key of keys) {
          currentEditors[key] = true;
        }
        this.currentArticleEditors = currentEditors;
      });
  };

  watchFormChanges = () => {
    this.articleEditForm.valueChanges.subscribe(change => {
      this.articleState = change;
      if (this.articleEditForm.dirty) {
        this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
          if (isSignedIn) {
            this.setEditSessionTimeout();
            if (!this.isUserEditingArticle()) {
              this.updateUserEditingStatus(true);
            }
          } else {
            this.dialogSvc.openMessageDialog(
              'Must be signed in',
              'You can not save changes without signing in or registering',
            );
          }
        });
      }
    });
  };
  // ===end form setup & breakdown

  // ===EDITING STUFF
  updateUserEditingStatus = async (status: boolean) =>
    this.articleSvc.updateArticleEditStatus(
      this.articleId,
      this.authSvc.authInfo$.value.uid,
      status,
    );

  resetEditStates = () => {
    this.articleEditForm.markAsPristine();
    // this.coverImageFile = null;
    this.activateCtrl(ECtrlNames.none);
    return this.updateUserEditingStatus(false);
  };

  addTag = (tag: string) => {
    this.articleState.tags.push(tag);
    this.articleEditForm.markAsDirty();
    this.articleEditForm.patchValue({ tags: this.articleState.tags });
  };

  /**
   * Expects the index of an article tag.
   *
   * Removes that tag, patches the form, marks form as dirty
   */
  removeTag = (tagIndex: number) => {
    const tags = this.articleState.tags;
    tags.splice(tagIndex, 1);
    this.articleEditForm.markAsDirty();
    this.articleEditForm.patchValue({ tags });
  };

  selectCoverImage = async (file: File) => {
    const reader = new FileReader();
    const orientation = await this.getExifOrientation(file);
    reader.onload = async () => {
      const rotatedImageUrl = await this.resetOrientation(
        reader.result as string,
        orientation,
      );
      this.articleEditForm.markAsDirty();
      this.articleEditForm.patchValue({ imageUrl: rotatedImageUrl });
    };
    reader.readAsDataURL(file);
    this.coverImageFile = file;
  };

  /**
   * algorithm paraphrased from https://stackoverflow.com/questions/20600800/js-client-side-exif-orientation-rotate-and-mirror-jpeg-images/31273162#31273162
   */
  resetOrientation = (srcBase64: string, srcOrientation: number) => {
    const img = new Image();
    const promise = new Promise<string>((resolve, reject) => {
      try {
        img.onload = () => {
          const width = img.width,
            height = img.height,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

          // set proper canvas dimensions before transform & export
          if (4 < srcOrientation && srcOrientation < 9) {
            canvas.width = height;
            canvas.height = width;
          } else {
            canvas.width = width;
            canvas.height = height;
          }

          // transform context before drawing image
          switch (srcOrientation) {
            case 2:
              ctx.transform(-1, 0, 0, 1, width, 0);
              break;
            case 3:
              ctx.transform(-1, 0, 0, -1, width, height);
              break;
            case 4:
              ctx.transform(1, 0, 0, -1, 0, height);
              break;
            case 5:
              ctx.transform(0, 1, 1, 0, 0, 0);
              break;
            case 6:
              ctx.transform(0, 1, -1, 0, height, 0);
              break;
            case 7:
              ctx.transform(0, -1, -1, 0, height, width);
              break;
            case 8:
              ctx.transform(0, -1, 1, 0, 0, width);
              break;
            default:
              break;
          }

          // draw image
          ctx.drawImage(img, 0, 0);

          // export base64
          resolve(canvas.toDataURL());
        };
      } catch (error) {
        reject(error);
      }
    });
    img.src = srcBase64;
    return promise;
  };

  /**
   * result possibilities:
   * -2: not jpeg
   * -1: not defined
   * other: EXIF orientation
   * Algorithm paraphrased from https://stackoverflow.com/questions/7584794/accessing-jpeg-exif-rotation-data-in-javascript-on-the-client-side/32490603#32490603
   */
  getExifOrientation = (file: File) => {
    const promise = new Promise<number>((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = e => {
          const file = event.target as FileReader;
          const view = new DataView(file.result as ArrayBuffer);
          if (view.getUint16(0, false) != 0xffd8) {
            return resolve(-2);
          }

          const length = view.byteLength;
          let offset = 2;

          while (offset < length) {
            if (view.getUint16(offset + 2, false) <= 8) {
              return resolve(-1);
            }

            let marker = view.getUint16(offset, false);
            offset += 2;

            if (marker == 0xffe1) {
              if (view.getUint32((offset += 2), false) != 0x45786966) {
                return resolve(-1);
              }

              let little = view.getUint16((offset += 6), false) == 0x4949;
              offset += view.getUint32(offset + 4, little);
              let tags = view.getUint16(offset, little);
              offset += 2;
              for (let i = 0; i < tags; i++) {
                if (view.getUint16(offset + i * 12, little) == 0x0112) {
                  return resolve(view.getUint16(offset + i * 12 + 8, little));
                }
              }
            } else if ((marker & 0xff00) != 0xff00) {
              break;
            } else {
              offset += view.getUint16(offset, false);
            }
          }
          return resolve(-1);
        };
        // ToDo: Ensure we aren't reading the file more than needed
        reader.readAsArrayBuffer(file);
      } catch (error) {
        reject(error);
      }
    });

    return promise;
  };

  changeBody = body => {
    this.articleEditForm.markAsDirty();
    this.articleEditForm.patchValue({ body });
  };

  saveChanges = async () => {
    this.authSvc.isSignedInOrPrompt().subscribe(isSignedIn => {
      if (!isSignedIn) {
        this.dialogSvc.openMessageDialog(
          'Must be signed in',
          'You can not save changes without signing in or registering',
        );
        return;
      }
      const coverImageSub = this.saveCoverImage().subscribe(async isReady => {
        if (!isReady) return;

        if (this.articleState.articleId) {
          // It's not new so just update existing and return
          try {
            const updateResult = await this.articleSvc.updateArticle(
              this.articleState,
            );
            this.resetEditSessionTimeout();
            await this.resetEditStates();
            // HACKY: see associated note in UpdateArticle inside ArticleService
            if (updateResult && updateResult[2]) {
              this.router.navigate([`article/${updateResult[2]}`]);
            }
          } catch (error) {
            this.dialogSvc.openMessageDialog(
              'Error saving article',
              'Attempting to save your changes returned the following error',
              error.message || error,
            );
          } finally {
            coverImageSub.unsubscribe();
            return;
          }
        } else {
          // It's a new article!
          try {
            await this.articleSvc.createArticle(
              this.loggedInUser,
              this.articleState,
              this.articleId,
            );
            this.resetEditSessionTimeout();
            // TODO: Ensure unsaved changes are actually being checked upon route change
            await this.resetEditStates(); // This could still result in race condition where real time updates are too slow.
            this.router.navigate([`article/${this.articleId}`]);
          } catch (error) {
            this.dialogSvc.openMessageDialog(
              'Error creating article',
              'Attempting to create the article returned the following error. If this persists, please let us know...',
              `Error: ${error.message || error}`,
            );
          } finally {
            if (coverImageSub) coverImageSub.unsubscribe();
            return;
          }
        }
      });
    });
  };

  /**
   * Emits true if the process is complete (either the image was saved or there was nothing to save)
   * Emits false if it's incomplete or cancelled or errors out
   */
  saveCoverImage = () => {
    const isComplete$ = new BehaviorSubject(false);
    if (!this.coverImageFile) {
      isComplete$.next(true);
    } else {
      try {
        const { task, ref } = this.articleSvc.uploadCoverImage(
          this.articleId,
          this.coverImageFile,
        );

        this.coverImageUploadTask = task;
        task.then(() => {
          ref.getDownloadURL().subscribe(imageUrl => {
            // Was reverting to wrong-orientation images before backend conversion
            // this.articleEditForm.patchValue({ imageUrl });
            this.articleState.imageUrl = imageUrl;
            this.coverImageFile = null;
            isComplete$.next(true);
          });
        });

        this.dialogSvc
          .openProgressDialog(
            'Uploading new cover image',
            'You can hide this dialog while you wait, or cancel the upload to go back to editing',
            task.percentageChanges(),
          )
          .afterClosed()
          .subscribe(shouldCancel => {
            if (shouldCancel) {
              this.cancelUpload(this.coverImageUploadTask);
              this.articleEditForm.markAsDirty();
              isComplete$.next(false);
            }
          });
      } catch (error) {
        console.error(error);
        isComplete$.next(false);
      }
    }

    return isComplete$;
    // In the original we did more such as keeping track of uploads in the database and
  };

  // ---Editor Session Management
  setEditSessionTimeout = () => {
    if (this.editSessionTimeoutSubscription) this.resetEditSessionTimeout();

    // 300000 ms = 5 minutes
    this.editSessionTimeoutSubscription = timer(300000)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.openTimeoutDialog();
      });
  };

  resetEditSessionTimeout = () =>
    this.editSessionTimeoutSubscription.unsubscribe();

  openTimeoutDialog = () => {
    const response$ = this.dialogSvc.openTimeoutDialog(
      45,
      'Are you still there?',
      'Your changes will be discarded and the page will reload so that others can have a chance to make edits.',
      "I'm done. Discard my changes now",
      "I'm still working. Give me more time.",
    );

    response$.afterClosed().subscribe(shouldEndSession => {
      if (shouldEndSession) {
        this.resetEditStates();
        location.reload();
      } else this.setEditSessionTimeout();
    });
  };

  cancelChanges = () => {
    const response$ = this.dialogSvc
      .openConfirmDialog(
        'Undo Edits',
        'Any unsaved changes will be discarded and the page will refresh.',
        'Are you sure?',
      )
      .afterClosed();

    response$.subscribe(shouldCancel => {
      if (shouldCancel) {
        this.resetEditStates();
        location.reload();
      }
    });
  };

  // ===end editing stuff

  // ===UI DISPLAY
  activateCtrl = async (ctrl: ECtrlNames) => {
    if (ctrl === ECtrlNames.none) {
      this.ctrlBeingEdited = ctrl;
      return;
    }
    // For now doesn't allow multiple editors. Will change later...
    if (!this.isUserEditingArticle() && this.isArticleBeingEdited()) {
      // Editors is an array so that we can later allow multilple collaborative editors.
      // For now we'll just check the first (only) element in the array
      const uid = Object.keys(this.currentArticleEditors)[0];
      this.userSvc
        .userRef(uid)
        .valueChanges()
        .pipe(take(1))
        .subscribe(user => {
          const cUser = new CUserInfo(user);
          this.dialogSvc.openMessageDialog(
            'Edit Locked',
            `The user "${cUser.displayName()}" is currently editing this article.`,
            'Please try again later.',
          );
        });
    } else {
      this.authSvc.isSignedInOrPrompt().subscribe(isLoggedIn => {
        if (isLoggedIn) {
          this.ctrlBeingEdited = ctrl;
        }
      });
    }
  };
  // ===end ui display

  // ===CONTROL HELPERS
  toggleCtrl = (ctrl: ECtrlNames) => {
    if (this.isCtrlActive(ctrl)) {
      this.activateCtrl(ECtrlNames.none);
      return;
    }
    this.activateCtrl(ctrl);
  };

  clickoutCtrl = (ctrl: ECtrlNames) => {
    if (ctrl === this.ctrlBeingEdited) {
      this.activateCtrl(ECtrlNames.none);
    }
  };

  isCtrlActive = (ctrl: ECtrlNames): boolean => {
    return this.ctrlBeingEdited === ctrl;
  };

  isUserEditingArticle = () =>
    !!this.currentArticleEditors[this.authSvc.authInfo$.value.uid];

  isArticleBeingEdited = () =>
    Object.keys(this.currentArticleEditors).length > 0;

  // ===OTHER
  tempTimestamp = () => fsTimestampNow();

  updateMetaTags = (article: IArticleDetail) => {
    const { title, introduction, body, tags, imageUrl } = article;
    const description = this.createMetaDescription(introduction, body);
    const keywords = tags.join(', ').toLowerCase();
    this.seoSvc.generateTags({ title, imageUrl, description, keywords });
  };

  createMetaDescription = (intro: string, body: string) => {
    const introLength = intro.length;
    if (introLength > 325) return intro.substr(0, 325).concat('...');
    const lengthToFill = 346 - introLength;
    const cleanBody = body
      .replace(/<\/?[^>]+(>|$)/g, ' ')
      .replace('&nbsp;', '')
      .replace(/\s+/g, ' ');
    return intro
      .concat(' - ')
      .concat(cleanBody.substr(0, lengthToFill))
      .concat('...');
  };
  // ===end other
}

// Types and Enums
export enum ECtrlNames {
  coverImage = 'coverImage',
  title = 'title',
  intro = 'intro',
  body = 'body',
  tags = 'tags',
  none = 'none',
}
