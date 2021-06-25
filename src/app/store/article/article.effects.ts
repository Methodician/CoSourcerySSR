import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ArticleService } from '@services/article.service';
import { PlatformService } from '@services/platform.service';
import { ArticleDetailI } from '@shared_models/article.models';
import { selectRouteParams } from '@store/router/router.selectors';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import {
  loadCurrentArticle,
  loadCurrentArticleFailure,
  loadCurrentArticleSuccess,
  loadNotFoundArticle,
  startNewArticle,
} from './article.actions';

@Injectable()
export class ArticleEffects {
  constructor(
    private actions$: Actions,
    private articleSvc: ArticleService,
    private store: Store,
    private afStorage: AngularFireStorage,
    private platformSvc: PlatformService,
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
                map(article => ({ ...article, articleId: id })),
                // !This whole thing may not be relevant (but maybe it is for author image if we ever display it) since it's not clear the cover image URL is updating after he fact. Not clear when or why we started doing it this way way back when...
                // switchMap(article => {
                //   const { articleId, coverImageId } = article;
                //   if (
                //      !!this.platformSvc.isBrowser &&
                //     !!coverImageId &&
                //     coverImageId !== ''
                //   ) {
                //     return this.afStorage
                //       .ref(`articleCoverImages/${articleId}/${coverImageId}`)
                //       .getDownloadURL()
                //       .pipe(map(imageUrl => ({ ...article, imageUrl })));
                //   }
                //   return of(article);
                // }),
                map(article => this.processArticleTimestamps(article)),
                map(article => loadCurrentArticleSuccess({ article })),
              )
          : of(loadNotFoundArticle()),
      ),
      catchError(error => of(loadCurrentArticleFailure({ error }))),
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
