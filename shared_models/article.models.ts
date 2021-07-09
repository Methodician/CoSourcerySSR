import { KeyMapI } from './index';

export interface ArticlePreviewI {
  articleId: string;
  authorId: string;
  coverImageId: string | boolean; // this feels hacky and smelly. Maybe should enable "ignoreUndefinedProperties" and leave it as optional
  title: string;
  introduction: string;
  imageUrl: string;
  imageAlt: string;
  lastUpdated: any;
  timestamp: any;
  version: number;
  editors: KeyMapI<number>;
  slug: string;
  commentCount?: number;
  viewCount?: number;
  tags?: string[];
  isFeatured?: boolean;
  isFlagged?: boolean;
}

export interface ArticleDetailI extends ArticlePreviewI {
  body: string;
  // I think this can be removed. Never has been used and could be added on with automations.
  authorImageUrl?: string;
  lastEditorId: string;
  tags?: string[];
  bodyImageIds: string[];
}

export const statsIconMap = {
  comment: 'assets/icons/comment.svg',
  edit: 'assets/icons/cycle.svg',
  tags: 'assets/icons/tag.svg',
  bookmark: 'assets/icons/bookmark.svg',
};
