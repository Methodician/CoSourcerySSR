import { SafeUrl } from '@angular/platform-browser';
import { createReducer, on } from '@ngrx/store';
import { ArticleDetailI } from '@shared_models/index';
import { clone } from 'lodash';
import {
  addArticleTag,
  loadCurrentArticleSuccess,
  loadNotFoundArticle,
  removeArticleTag,
  resetArticleState,
  setCoverImageFile,
  setCoverImageUriSuccess,
  setCurrentArticleId,
  startNewArticle,
  undoArticleEdits,
  updateCurrentArticle,
} from './article.actions';

const NOT_FOUND_ARTICLE: ArticleDetailI = {
  articleId: 'fake-news',
  authorId: '',
  // authorImageUrl: '../../assets/images/feeling-lost.jpg',
  body: 'No article exists for the route supplied. Please return to home by clicking the CoSourcery icon in the upper left.',
  coverImageId: '',
  editors: null,
  imageAlt: 'Cover Image',
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
  title: 'Please enter a title.',
  introduction: 'Please enter an introduction.',
  body: 'Please enter a body.',
  imageUrl: '',
  imageAlt: 'Cover Image',
  // authorImageUrl: '',
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
  dbArticle: ArticleDetailI;
  currentArticleId: string;
  isArticleNew: boolean;
  coverImageFile: File;
  coverImageUri: string | ArrayBuffer | SafeUrl;
}

export const initialState: ArticleStateI = {
  currentArticle: null,
  dbArticle: null,
  currentArticleId: null,
  isArticleNew: false,
  coverImageFile: null,
  coverImageUri: 'assets/images/logo.svg',
};

const newArticleState: ArticleStateI = {
  currentArticle: BASE_ARTICLE,
  dbArticle: BASE_ARTICLE,
  currentArticleId: null,
  isArticleNew: true,
  coverImageFile: null,
  coverImageUri: 'assets/images/logo.svg',
};

export const articleReducer = createReducer(
  initialState,
  on(loadCurrentArticleSuccess, (state, { article }) => ({
    ...state,
    currentArticle: article,
    dbArticle: article,
  })),
  on(updateCurrentArticle, (state, { article }) => ({
    ...state,
    currentArticle: article,
  })),
  on(setCurrentArticleId, (state, { currentArticleId }) => ({
    ...state,
    currentArticleId,
  })),
  on(addArticleTag, (state, { tag }) => {
    const { currentArticle } = state;
    const tags = clone(currentArticle.tags) || [];
    tags.push(tag);

    return { ...state, currentArticle: { ...currentArticle, tags } };
  }),
  on(removeArticleTag, (state, { tag }) => {
    const { currentArticle } = state;
    // Note: filter creates a new array so no need to clone anything
    const tags = currentArticle.tags.filter(item => item !== tag);

    return { ...state, currentArticle: { ...currentArticle, tags } };
  }),
  on(undoArticleEdits, state => ({
    ...state,
    coverImageFile: null,
    currentArticle: state.dbArticle,
  })),
  on(resetArticleState, () => initialState),
  on(startNewArticle, () => newArticleState),
  on(loadNotFoundArticle, (state, _) => ({
    ...state,
    currentArticle: NOT_FOUND_ARTICLE,
  })),
  on(setCoverImageFile, (state, { coverImageFile }) => ({
    ...state,
    coverImageFile,
  })),
  on(setCoverImageUriSuccess, (state, { coverImageUri }) => ({
    ...state,
    coverImageUri,
  })),
);
