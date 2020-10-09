export interface CommentI {
  authorId: string;
  parentKey: string;
  text: string;
  replyCount: number;
  parentType: EParentTypes;
  voteCount: number;
  key?: string;
  timestamp?: number;
  lastUpdated?: number;
}

export enum EParentTypes {
  article = 'article',
  comment = 'comment',
}

export enum EVoteDirections {
  up = 1,
  down = -1,
}
