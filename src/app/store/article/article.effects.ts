import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
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
  setCoverImageUri,
  startNewArticle,
} from './article.actions';

@Injectable()
export class ArticleEffects {
  constructor(
    private actions$: Actions,
    private articleSvc: ArticleService,
    private store: Store,
    private afStorage: AngularFireStorage,
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
                mergeMap(article =>
                  concat(
                    of(loadCurrentArticleSuccess({ article })),
                    this.afStorage
                      .ref(
                        `articleCoverImages/${article.articleId}/${article.coverImageId}`,
                      )
                      .getDownloadURL()
                      .pipe(
                        map(coverImageUri =>
                          setCoverImageUri({ coverImageUri }),
                        ),
                      ),
                  ),
                ),
              )
          : of(loadNotFoundArticle()),
      ),
      catchError(error => of(loadCurrentArticleFailure({ error }))),
    ),
  );

  setCoverImageFromFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(setCoverImageFile),
      exhaustMap(action => {
        console.log(action);
        const { coverImageFile } = action;
        const reader = new FileReader();
        const result$ = fromEvent(reader, 'load').pipe(map(_ => reader.result));
        result$.subscribe(console.log);
        reader.readAsDataURL(coverImageFile);

        return result$.pipe(
          map(coverImageUri => setCoverImageUri({ coverImageUri })),
        );
      }),
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
