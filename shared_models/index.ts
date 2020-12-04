export interface KeyMapI<T> {
  [key: string]: T;
}
export interface HtmlInputEventI extends Event {
  target: HTMLInputElement & EventTarget;
}

export { ArticleDetailI, ArticlePreviewI } from './article.models';

export { CommentI, ParentTypesE, VoteDirectionsE } from './comment.models';
