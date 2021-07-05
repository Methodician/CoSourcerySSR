import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { DomSanitizer } from '@angular/platform-browser';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ArticleService } from '@services/article.service';
import { ArticleDetailI } from '@shared_models/article.models';
import { selectRouteParams } from '@store/router/router.selectors';
import { concat, fromEvent, Observable, of } from 'rxjs';
import {
  catchError,
  exhaustMap,
  map,
  mergeMap,
  switchMap,
  take,
} from 'rxjs/operators';
import {
  loadCurrentArticle,
  loadCurrentArticleFailure,
  loadCurrentArticleSuccess,
  loadNotFoundArticle,
  setCoverImageFile,
  setCoverImageFileFailure,
  setCoverImageUri,
  setCoverImageUriSuccess,
  startNewArticle,
  undoArticleEdits,
} from './article.actions';
import { dbArticle } from './article.selectors';

@Injectable()
export class ArticleEffects {
  constructor(
    private actions$: Actions,
    private articleSvc: ArticleService,
    private store: Store,
    private afStorage: AngularFireStorage,
    private sanitizer: DomSanitizer,
  ) {}

  loadCurrengArticle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCurrentArticle),
      switchMap(() => this.store.select(selectRouteParams).pipe(take(1))),
      // TODO: Change this param to "slug" if that is how we'll use it exclusively
      switchMap(params => this.idFromSlug(params['id'])),
      switchMap(id =>
        id === 'new'
          ? of(startNewArticle())
          : !!id
          ? this.articleSvc
              .articleDetailRef(id)
              .valueChanges()
              .pipe(
                // This is in case we want to stop storing articleId in the document itself
                map(article => ({
                  ...article,
                  articleId: id,
                  // !turns out I am getting some issues from articles in DB that
                  // ! have odd stuff for image url and coverImageId - need to re-think this or maybe clean up data before migration
                  coverImageId: article.coverImageId,
                  // !May eleiminate this part alltogether because now keeping imageUri on store
                  imageUrl: article.imageUrl,
                })),
                map(article => this.processArticleTimestamps(article)),
                switchMap(article =>
                  !!article.coverImageId
                    ? this.afStorage
                        .ref(
                          `articleCoverImages/${article.articleId}/${article.coverImageId}`,
                        )
                        .getDownloadURL()
                        .pipe(
                          map(coverImageUri => ({ coverImageUri, article })),
                        )
                    : of({ coverImageUri: 'assets/images/logo.svg', article }),
                ),
                mergeMap(({ coverImageUri, article }) => [
                  loadCurrentArticleSuccess({ article }),
                  setCoverImageUriSuccess({ coverImageUri }),
                ]),
              )
          : of(loadNotFoundArticle()),
      ),
      catchError(error => of(loadCurrentArticleFailure({ error }))),
    ),
  );

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
