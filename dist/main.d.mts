declare class FacebookCleaner {
    private facebookRequest;
    constructor(cookies: string);
    removeAllFriends: (batchSize?: number) => Promise<void>;
    removeAllLikedPages: (batchSize?: number) => Promise<void>;
    leaveAllGroups: (batchSize?: number) => Promise<void>;
    unfollowAllPagesAndUsers: (batchSize?: number) => Promise<void>;
    cancelAllSentFriendRequests: (batchSize?: number) => Promise<void>;
    deletePosts: (limit?: number, batchSize?: number) => Promise<void>;
    changePostsPrivacy: (privacy: "SELF" | "EVERYONE" | "FRIENDS", limit?: number, batchSize?: number) => Promise<void>;
    deleteReactions: (fromDate: string, toDate: string, batchSize?: number) => Promise<void>;
    deleteComments: (fromDate: string, toDate: string, batchSize?: number) => Promise<void>;
}

interface IFollowing {
    id: string;
    name: string;
    url: string;
}
interface IFriend {
    id: string;
    name: string;
    url: string;
}
interface IJoinedGroups {
    id: string;
    name: string;
    url: string;
}
interface ILikedPages {
    id: string;
    name: string;
    url: string;
}
interface ISentFriendRequest {
    id: string;
    name: string;
    url: string;
}

declare class FacebookStatistics {
    private facebookRequest;
    constructor(cookies: string);
    getLikedPages: (writeToCSV?: boolean) => Promise<ILikedPages[]>;
    getFriends: (writeToCSV?: boolean) => Promise<IFriend[]>;
    getFollowings: (writeToCSV?: boolean) => Promise<IFollowing[]>;
    getJoinedGroups: (writeToCSV?: boolean) => Promise<IJoinedGroups[]>;
    getSentFriendRequests: (writeToCSV?: boolean) => Promise<ISentFriendRequest[]>;
}

export { FacebookCleaner, FacebookStatistics };
