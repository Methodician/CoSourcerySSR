import { IKeyMap } from './index';

export interface ArticlePreviewI {
  articleId: string;
  authorId: string;
  title: string;
  introduction: string;
  imageUrl: string;
  imageAlt: string;
  lastUpdated: any;
  timestamp: any;
  version: number;
  editors: IKeyMap<number>;
  slug: string;
  commentCount?: number;
  viewCount?: number;
  tags?: string[];
  isFlagged?: boolean;
}

export interface ArticleDetailI {
  articleId: string;
  authorId: string;
  title: string;
  introduction: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  authorImageUrl: string;
  lastUpdated: any;
  timestamp: any;
  lastEditorId: string;
  version: number;
  editors: IKeyMap<number>;
  slug: string;
  commentCount?: number;
  viewCount?: number;
  tags?: string[];
  isFeatured?: boolean;
  isFlagged?: boolean;
}
