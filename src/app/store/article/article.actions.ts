import { SafeUrl } from '@angular/platform-browser';
import { createAction, props } from '@ngrx/store';
import { ArticleDetailI } from '@shared_models/index';

export const resetArticleState = createAction(
  '[Article] Reset Current Article',
);

export const startNewArticle = createAction('[Article] Start New Article');

export const loadNotFoundArticle = createAction(
  '[Article] Load Not Found Article',
);

export const updateCurrentArticle = createAction(
  '[Article] Update Current Article',
  props<{ article: ArticleDetailI }>(),
);

export const setCurrentArticleId = createAction(
  '[Article] Set article ID',
  props<{ currentArticleId: string }>(),
);

export const undoArticleEdits = createAction('[Article] Undo Article Edits');

export const addArticleTag = createAction(
  '[Article] Add Tag to Article',
  props<{ tag: string }>(),
);

export const removeArticleTag = createAction(
  '[Article] Remove Tag from Article',
  props<{ tag: string }>(),
);

export const loadCurrentArticle = createAction(
  '[Article] Load Current Article',
);

export const loadCurrentArticleSuccess = createAction(
  '[Article] Load Current Article Success',
  props<{ article: ArticleDetailI }>(),
);

export const loadCurrentArticleFailure = createAction(
  '[Article] Load Current Article Failure',
  props<{ error: any }>(),
);

export const updateArticleMetatagsSuccess = createAction(
  '[Article] Successfully updated metatags for article',
);

export const updateArticleMetatagsFailure = createAction(
  '[Article] Failed to update metatags for article',
  props<{ error: any }>(),
);

export const saveArticleChanges = createAction('[Article] Save Changes');

export const createArticleSuccess = createAction(
  '[Article] Successfully added new article to database',
  props<{ newArticleSlug: string }>(),
);

export const createArticleRedirect = createAction(
  '[Article] Redirect user to new article page',
);

export const updateArticleSuccess = createAction(
  '[Article] Successfully updated existing article in database',
);

export const saveArticleFailure = createAction(
  '[Article] Failed to save changes',
  props<{ error: any }>(),
);

export const setCoverImageFile = createAction(
  '[Article] Set Cover Image File',
  props<{ coverImageFile: File }>(),
);

export const setCoverImageFileFailure = createAction(
  '[Article] Failed to set cover image file',
  props<{ error: any }>(),
);

export const setCoverImageUri = createAction(
  '[Article] Set Cover Image URI',
  props<{ coverImageUri: string | ArrayBuffer }>(),
);

export const setCoverImageUriSuccess = createAction(
  '[Acticle] Sucessfully set cover image URI',
  props<{ coverImageUri: string | ArrayBuffer | SafeUrl }>(),
);
