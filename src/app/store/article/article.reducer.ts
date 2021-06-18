import { Validators } from '@angular/forms';
import { Action, createReducer, on } from '@ngrx/store';
import { ArticleDetailI } from '@shared_models/index';
import { loadCurrentArticleSuccess } from './article.actions';

const BASE_ARTICLE: ArticleDetailI = {
  articleId: '',
  authorId: '',
  coverImageId: false,
  title: '',
  introduction: '',
  body: 'This article is empty.',
  imageUrl: '',
  imageAlt: '',
  authorImageUrl: '',
  lastUpdated: null,
  timestamp: 0,
  lastEditorId: '',
  version: 1,
  commentCount: 0,
  viewCount: 0,
  slug: '',
  tags: [],
  isFeatured: false,
  editors: {},
  bodyImageIds: [],
};

export const articleFeatureKey = 'article';

export interface ArticleStateI {
  currentArticle: ArticleDetailI;
}

export const initialState: ArticleStateI = {
  currentArticle: BASE_ARTICLE,
};

export const articleReducer = createReducer(
  initialState,
  on(loadCurrentArticleSuccess, (state, { article }) => ({
    ...state,
    currentArticle: article,
  })),
);
