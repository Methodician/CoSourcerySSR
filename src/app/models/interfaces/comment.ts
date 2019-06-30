export interface Comment {
  authorId: string;
  parentKey: string;
  text: string;
  replyCount: number;
  parentType: ParentTypes;
  voteCount: number;
  key?: string;
  timestamp?: number;
  lastUpdated?: number;
}

export enum ParentTypes {
  article = 'article',
  comment = 'comment',
}

export enum VoteDirections {
  up = 1,
  down = -1,
}
