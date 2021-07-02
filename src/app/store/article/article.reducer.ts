import { createReducer, on } from '@ngrx/store';
import { ArticleDetailI } from '@shared_models/index';
import { clone } from 'lodash';
import {
  addArticleTag,
  loadCurrentArticleSuccess,
  loadNotFoundArticle,
  removeArticleTag,
  resetArticleState,
  startNewArticle,
  updateCurrentArticle,
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
  dbArticle: ArticleDetailI;
  isArticleNew: boolean;
}

export const initialState: ArticleStateI = {
  currentArticle: null,
  dbArticle: null,
  isArticleNew: false,
};

const newArticleState: ArticleStateI = {
  currentArticle: BASE_ARTICLE,
  dbArticle: BASE_ARTICLE,
  isArticleNew: true,
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
  // !In this current system adding and removing tags fails to mark form as dirty and it's not easy to fix
  on(addArticleTag, (state, { tag }) => {
    const { currentArticle } = state;
    const tags = clone(currentArticle.tags) || [];
    tags.push(tag);

    return { ...state, currentArticle: { ...currentArticle, tags } };
  }),
  on(removeArticleTag, (state, { tag }) => {
    const { currentArticle } = state;
    const tags = currentArticle.tags.filter(item => item !== tag);

    return { ...state, currentArticle: { ...currentArticle, tags } };
  }),
  on(resetArticleState, () => initialState),
  on(startNewArticle, () => newArticleState),
  on(loadNotFoundArticle, (state, _) => ({
    ...state,
    currentArticle: NOT_FOUND_ARTICLE,
  })),
);
