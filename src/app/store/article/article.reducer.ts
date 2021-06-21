import { Validators } from '@angular/forms';
import { Action, createReducer, on } from '@ngrx/store';
import { ArticleDetailI } from '@shared_models/index';
import {
  loadCurrentArticleSuccess,
  loadNotFoundArticle,
  resetCurrentArticle,
} from './article.actions';

const NOT_FOUND_ARTICLE: ArticleDetailI = {
  articleId: 'fake-news',
  authorId: '',
  authorImageUrl: '../../assets/images/feeling-lost.jpg',
  body: 'No article exists for the route supplied. Please return to home by clicking the CoSourcery icon in the upper left.',
  coverImageId: '',
  editors: null,
  imageAlt: '',
  imageUrl: '../../assets/images/feeling-lost.jpg',
  introduction: 'The article you seek is a mirage.',
  lastEditorId: '',
  lastUpdated: new Date(),
  slug: 'no-existing-article',
  timestamp: new Date(),
  title: 'Fake News',
  version: 0,
  commentCount: 0,
  tags: ['FAKE', 'MADE UP', 'UNREAL', 'STUB', 'BAD ROUTE'],
  bodyImageIds: [],
};

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
  on(resetCurrentArticle, (state, _) => ({
    ...state,
    currentArticle: BASE_ARTICLE,
  })),
  on(loadNotFoundArticle, (state, _) => ({
    ...state,
    currentArticle: NOT_FOUND_ARTICLE,
  })),
);
