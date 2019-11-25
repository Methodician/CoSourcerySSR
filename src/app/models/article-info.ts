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
  authorImageUrl: string;
  body: string;
  bodyImages?: IBodyImageMap;
  commentCount?: number;
  editors: IKeyMap<number>;
  imageAlt: string;
  imageUrl: string;
  introduction: string;
  isFeatured?: boolean;
  isFlagged?: boolean;
  lastEditorId: string;
  lastUpdated: any;
  tags?: string[];
  timestamp: any;
  title: string;
  version: number;
  viewCount?: number;
}

export interface IBodyImageMeta {
  orientation: number;
  path: string;
}

export interface IBodyImageMap extends IKeyMap<IBodyImageMeta> {}
