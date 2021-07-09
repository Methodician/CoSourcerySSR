import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ArticleService } from '@services/article.service';
import { FirebaseService } from '@services/firebase.service';
import { SeoService } from '@services/seo.service';
import { ArticleDetailI } from '@shared_models/article.models';
import { authUid, isLoggedIn } from '@store/auth/auth.selectors';
import { selectRouteParams } from '@store/router/router.selectors';
import { from, fromEvent, Observable, of } from 'rxjs';
import {
  catchError,
  exhaustMap,
  map,
  mergeMap,
  single,
  switchMap,
  take,
} from 'rxjs/operators';
import {
  createArticleRedirect,
  createArticleSuccess,
  loadCurrentArticle,
  loadCurrentArticleFailure,
  loadCurrentArticleSuccess,
  loadNotFoundArticle,
  saveArticleChanges,
  saveArticleFailure,
  setCoverImageFile,
  setCoverImageFileFailure,
  setCoverImageUri,
  setCoverImageUriSuccess,
  setCurrentArticleId,
  startNewArticle,
  undoArticleEdits,
  updateArticleMetatagsFailure,
  updateArticleMetatagsSuccess,
  updateArticleSuccess,
} from './article.actions';
import { currentArticleChanges, dbArticle } from './article.selectors';

export interface SEOtagsI {
  title?: string;
  description?: string;
  imageUrl?: string;
  keywords?: string;
  canonicalUrl?: string;
  slug?: string;
  tags?: string[];
}
@Injectable()
export class ArticleEffects {
  constructor(
    private actions$: Actions,
    private articleSvc: ArticleService,
    private fbSvc: FirebaseService,
    private seoSvc: SeoService,
    private store: Store,
    private afStorage: AngularFireStorage,
    private afDatabase: AngularFireDatabase,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {}

  updateMetaTags$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCurrentArticleSuccess),
      exhaustMap(({ article }) =>
        !!article.coverImageId
          ? this.afStorage
              .ref(
                `articleCoverImages/${article.articleId}/${article.coverImageId}`,
              )
              .getDownloadURL()
              .pipe(map(coverImageUri => ({ coverImageUri, article })))
          : of({ coverImageUri: 'assets/images/logo.svg', article }),
      ),
      exhaustMap(({ coverImageUri, article }) => {
        const { title, introduction, body, tags, slug } = article;

        const createMetaDescription = () => {
          const introLength = introduction.length;
          if (introLength > 325)
            return introduction.substr(0, 325).concat('...');
          const lengthToFill = 346 - introLength;
          const cleanBody = body
            .replace(/<\/?[^>]+(>|$)/g, ' ')
            .replace('&nbsp;', '')
            .replace(/\s+/g, ' ');
          return introduction
            .concat(' - ')
            .concat(cleanBody.substr(0, lengthToFill))
            .concat('...');
        };

        const SEOTags: SEOtagsI = {
          title,
          imageUrl: coverImageUri,
          description: createMetaDescription(),
          keywords: tags.join(', ').toLowerCase(),
          canonicalUrl: `https://cosourcery.com/article/${slug}`,
        };

        this.seoSvc.generateTags(SEOTags);

        return of(updateArticleMetatagsSuccess());
      }),
      catchError(error => of(updateArticleMetatagsFailure({ error }))),
    ),
  );

  // LOADS CURRENT ARTICLE OR NEW ARTICLE INITIALLY
  loadCurrentArticle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCurrentArticle),
      switchMap(() => this.store.select(selectRouteParams).pipe(take(1))),
      // TODO: Change this param to "slug" if that is how we'll use it exclusively
      switchMap(params => this.idFromSlug(params['id'])),
      switchMap(id => {
        // set new article state and create new article ID
        const loadNewArticle = () => [
          startNewArticle(),
          setCurrentArticleId({ currentArticleId: this.articleSvc.createId() }),
        ];

        const loadExistingArticle = (currentArticleId: string) =>
          this.articleSvc
            .articleDetailRef(currentArticleId)
            .valueChanges()
            .pipe(
              // This is in case we want to stop storing articleId in the document itself
              map(article => ({
                ...article,
                // !No need for articleId (kept in store) so remove this after refactor
                articleId: currentArticleId,
                // !turns out I am getting some issues from articles in DB that
                // ! have odd stuff for image url and coverImageId - need to re-think this or maybe clean up data before migration
                coverImageId: article.coverImageId,
                // !May eleiminate this part alltogether because now keeping imageUri on store
                imageUrl: article.imageUrl,
                // !same here, need to eliminate and do data cleanup script in prod db
                authorImageUrl: article.authorImageUrl,
              })),
              map(article => this.processArticleTimestamps(article)),
              switchMap(article =>
                !!article.coverImageId
                  ? this.afStorage
                      .ref(
                        `articleCoverImages/${article.articleId}/${article.coverImageId}`,
                      )
                      .getDownloadURL()
                      .pipe(map(coverImageUri => ({ coverImageUri, article })))
                  : of({ coverImageUri: 'assets/images/logo.svg', article }),
              ),
              mergeMap(({ coverImageUri, article }) => [
                loadCurrentArticleSuccess({ article }),
                setCoverImageUriSuccess({ coverImageUri }),
                setCurrentArticleId({ currentArticleId }),
              ]),
            );

        const setNotfoundArticle = () => [
          loadNotFoundArticle(),
          setCurrentArticleId({ currentArticleId: null }),
        ];

        return id === 'new'
          ? loadNewArticle()
          : !!id
          ? loadExistingArticle(id)
          : setNotfoundArticle();
      }),
      catchError(error => of(loadCurrentArticleFailure({ error }))),
    ),
  );

  saveArticleChanges$ = createEffect(() => {
    // Possibly overkill function to handle both updating and creating articles.
    // May break out into separate actions later...
    const processArticleChanges$ = () =>
      this.store.select(currentArticleChanges).pipe(
        take(1),
        switchMap(changes => {
          const saveArticleCoverImage$ = ({
            currentArticle,
            currentArticleId,
            coverImageFile,
            isArticleNew,
          }: {
            currentArticle: ArticleDetailI;
            currentArticleId: string;
            coverImageFile: File;
            isArticleNew: boolean;
          }) => {
            const coverImageId = this.articleSvc.createId();
            const task = this.afStorage
              .ref(`articleCoverImages/${currentArticleId}/${coverImageId}`)
              .put(coverImageFile);

            return task.snapshotChanges().pipe(
              single(snapshot => snapshot.state === 'success'),
              map(snapshot => ({
                currentArticle,
                currentArticleId,
                isArticleNew,
                coverImageId,
                snapshot,
              })),
            );
          };

          const skipCoverImage$ = ({
            currentArticle,
            currentArticleId,
            isArticleNew,
          }: {
            currentArticle: ArticleDetailI;
            currentArticleId: string;
            isArticleNew: boolean;
          }) => {
            return of({
              currentArticle,
              currentArticleId,
              isArticleNew,
              coverImageId: null as string,
              snapshot: null,
            });
          };

          if (!!changes.coverImageFile) {
            return saveArticleCoverImage$(changes);
          } else {
            return skipCoverImage$(changes);
          }
        }),
        switchMap(
          ({
            currentArticle,
            currentArticleId,
            isArticleNew,
            coverImageId,
          }) => {
            if (!currentArticleId)
              throw new Error(
                'Can not save article without specified article ID',
              );

            const isNewSlugValid$ = (newSlug: string) =>
              this.afDatabase
                .object<string>(`articleData/slugs/${newSlug}`)
                .valueChanges()
                .pipe(
                  take(1),
                  map(articleId => !articleId),
                );

            const throwBadSlugError = () => {
              throw new Error(
                'The title provided is not unique enough to produce an available URL slug',
              );
            };

            // This part is triggered if the article is new
            const createArticle$ = (authUid: string, newSlug: string) => {
              return isNewSlugValid$(newSlug).pipe(
                switchMap(isValid => {
                  if (!isValid) {
                    throwBadSlugError();
                  }

                  const newArticle: ArticleDetailI = {
                    ...currentArticle,
                    editors: { [authUid]: 1 },
                    authorId: authUid,
                    lastEditorId: authUid,
                    coverImageId,
                    lastUpdated: this.fbSvc.fsServerTimestamp(),
                    timestamp: this.fbSvc.fsServerTimestamp(),
                    slug: newSlug,
                  };

                  const createTrackingSlugPromise = () =>
                    this.afDatabase
                      .object(`articleData/slugs/${newSlug}`)
                      .set(currentArticleId);

                  const setArticlePromise = () =>
                    this.articleSvc
                      .articleDetailRef(currentArticleId)
                      .set(newArticle, { merge: true });

                  return from(
                    Promise.all([
                      createTrackingSlugPromise(),
                      setArticlePromise(),
                    ]),
                  ).pipe(
                    map(_ => createArticleSuccess({ newArticleSlug: newSlug })),
                  );
                }),
              );
            };

            // This part is triggered if the article is not new
            const updateArticle$ = (authUid: string, newSlug: string) => {
              const isSlugChanged = newSlug !== currentArticle.slug;

              const updateTrackingSlugPromise = () => {
                const newSlugPath = `articleData/slugs/${newSlug}`;
                const oldSlugPath = `articleData/slugs/${currentArticle.slug}`;

                const updates = {
                  [newSlugPath]: currentArticleId,
                  [oldSlugPath]: null,
                };

                const batch = this.afDatabase.database.ref().update(updates);
                return batch;
              };

              const previousEditCount = currentArticle.editors[authUid] || 0;

              const changedArticle = {
                ...currentArticle,
                slug: newSlug,
                editors: {
                  ...currentArticle.editors,
                  [authUid]: previousEditCount + 1,
                },
                lastEditorId: authUid,
                coverImageId,
                lastUpdated: this.fbSvc.fsServerTimestamp(),
                version: currentArticle.version + 1,
              };

              const articleUpdatePromise = this.articleSvc
                .articleDetailRef(currentArticleId)
                .update(changedArticle);

              return isSlugChanged
                ? isNewSlugValid$(newSlug).pipe(
                    switchMap(isValid => {
                      if (!isValid) {
                        throwBadSlugError();
                      }

                      const slugUpdateBatchPromise =
                        updateTrackingSlugPromise();

                      const updates$ = from(
                        Promise.all([
                          slugUpdateBatchPromise,
                          articleUpdatePromise,
                        ]),
                      );

                      return updates$.pipe(map(_ => updateArticleSuccess()));
                    }),
                  )
                : from(articleUpdatePromise).pipe(
                    map(_ => updateArticleSuccess()),
                  );
            };

            return this.store.select(authUid).pipe(
              take(1),
              switchMap(authUid => {
                const newSlug = this.articleSvc.slugify(
                  currentArticle.title,
                ) as string;
                return isArticleNew
                  ? createArticle$(authUid, newSlug)
                  : updateArticle$(authUid, newSlug);
              }),
            );
          },
        ),
        catchError(error => of(saveArticleFailure({ error }))),
      );

    return this.actions$.pipe(
      ofType(saveArticleChanges),
      exhaustMap(() =>
        this.store.select(isLoggedIn).pipe(
          take(1),
          switchMap(isLoggedIn =>
            isLoggedIn
              ? processArticleChanges$()
              : of(
                  saveArticleFailure({
                    error: new Error(
                      'Can not save changes unless authenticated',
                    ),
                  }),
                ),
          ),
          catchError(error => of(saveArticleFailure({ error }))),
        ),
      ),
    );
  });

  createArticleSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(createArticleSuccess),
      exhaustMap(({ newArticleSlug }) =>
        this.router.navigateByUrl(`/article/${newArticleSlug}`),
      ),
      map(_ => createArticleRedirect()),
    );
  });

  undoArticleEdits$ = createEffect(() =>
    this.actions$.pipe(
      ofType(undoArticleEdits),
      switchMap(() => this.store.select(dbArticle)),
      switchMap(article =>
        !!article.coverImageId
          ? this.afStorage
              .ref(
                `articleCoverImages/${article.articleId}/${article.coverImageId}`,
              )
              .getDownloadURL()
              .pipe(map(coverImageUri => setCoverImageUri({ coverImageUri })))
          : of(
              setCoverImageUri({
                coverImageUri: 'assets/images/logo.svg',
              }),
            ),
      ),
    ),
  );

  setCoverImageFromFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(setCoverImageFile),
      exhaustMap(action => {
        const { coverImageFile } = action;
        const reader = new FileReader();
        reader.readAsDataURL(coverImageFile);

        return fromEvent(reader, 'load').pipe(
          take(1),
          map(_ => reader.result),
          map(coverImageUri => setCoverImageUri({ coverImageUri })),
        );
      }),
      catchError(error => of(setCoverImageFileFailure({ error }))),
    ),
  );

  setCoverImageUri$ = createEffect(() =>
    this.actions$.pipe(
      ofType(setCoverImageUri),
      map(({ coverImageUri }) =>
        this.sanitizer.bypassSecurityTrustUrl(coverImageUri.toString()),
      ),
      map(coverImageUri => setCoverImageUriSuccess({ coverImageUri })),
    ),
  );

  idFromSlug = (slug: string): Observable<string> =>
    !slug
      ? of('new')
      : this.articleSvc.slugIdRef(slug).valueChanges().pipe(take(1));

  processArticleTimestamps = (article: ArticleDetailI) => {
    const { timestamp, lastUpdated } = article;
    if (timestamp) article.timestamp = timestamp.toDate();
    if (lastUpdated) article.lastUpdated = lastUpdated.toDate();
    return article;
  };
}
