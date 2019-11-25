import { IKeyMap } from '@models/shared';

export interface IArticlePreview {
  articleId: string;
  authorId: string;
  commentCount?: number;
  editors: IKeyMap<number>;
  imageAlt: string;
  imageUrl: string;
  isFlagged?: boolean;
  introduction: string;
  lastUpdated: any;
  tags?: string[];
  timestamp: any;
  title: string;
  version: number;
  viewCount?: number;
}

export interface IArticleDetail {
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
  commentCount?: number;
  viewCount?: number;
  tags?: string[];
  isFeatured?: boolean;
  isFlagged?: boolean;
  bodyImages?: IBodyImageMap;
}

export interface IBodyImageMeta {
  orientation: number;
  path: string;
}

export interface IBodyImageMap extends IKeyMap<IBodyImageMeta> {}
