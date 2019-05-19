export interface ArticlePreview {
  articleId: string;
  authorId: string;
  title: string;
  introduction: string;
  imageUrl: string;
  imageAlt: string;
  lastUpdated: any;
  timestamp: any;
  version: number;
  editors: KeyMap<number>;
  commentCount?: number;
  viewCount?: number;
  tags?: string[];
  isFlagged?: boolean;
}

export interface KeyMap<T> {
  [key: string]: T;
}
