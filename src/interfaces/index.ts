export interface ICachedCursor {
  totalFetchedItems: number;
  nextCursor: string;
}

export interface ICurrentUserToken {
  userId: string;
  fbDtsg: string;
}

export interface IFollowing {
  id: string;
  name: string;
  url: string;
}

export interface IFriend {
  id: string;
  name: string;
  url: string;
}

export interface IJoinedGroups {
  id: string;
  name: string;
  url: string;
}

export interface ILikedPages {
  id: string;
  name: string;
  url: string;
}

export interface ISentFriendRequest {
  id: string;
  name: string;
  url: string;
}

export interface IReactionData {
  storyId: string;
  postId: string;
}

export interface ICommentData {
  storyId: string;
  postId: string;
}
