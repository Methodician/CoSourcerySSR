export class ArticlePreview {
  constructor(
    public articleId: string,
    public authorId: string,
    public title: string,
    public introduction: string,
    public imageUrl: string,
    public imageAlt: string,
    public lastUpdated: any,
    public timestamp: any,
    public version: number,
    public editors: KeyMap<number>,
    public commentCount?: number,
    public viewCount?: number,
    public tags?: string[],
    public isFlagged?: boolean,
  ) {}
}

export class ArticleDetail {
  constructor(
    public articleId: string,
    public authorId: string,
    public title: string,
    public introduction: string,
    public body: string,
    public imageUrl: string,
    public imageAlt: string,
    public authorImageUrl: string,
    public lastUpdated: any,
    public timestamp: any,
    public lastEditorId: string,
    public version: number,
    public editors: KeyMap<number>,
    public commentCount?: number,
    public viewCount?: number,
    public tags?: string[],
    public isFeatured?: boolean,
    public isFlagged?: boolean,
    public bodyImages?: BodyImageMap,
  ) {}
}

export interface BodyImageMeta {
  orientation: number;
  path: string;
}

export interface KeyMap<T> {
  [key: string]: T;
}

export interface BodyImageMap extends KeyMap<BodyImageMeta> {}
