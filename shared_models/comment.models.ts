export interface CommentI {
  authorId: string;
  parentKey: string;
  text: string;
  replyCount: number;
  parentType: ParentTypesE;
  voteCount: number;
  key?: string;
  timestamp?: any;
  lastUpdated?: any;
  removedAt?: any;
}

export enum ParentTypesE {
  article = 'article',
  comment = 'comment',
}

export enum VoteDirectionsE {
  up = 1,
  down = -1,
}
