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

interface IRequestOptions {
    retryCount?: number;
    retryDelayInMs?: number;
}

interface ICleanerOptions {
    concurrencySize?: number;
    limit?: number;
    delayInMs?: number;
}
declare class FacebookCleaner {
    private facebookRequest;
    constructor(cookies: string, requestOptions?: IRequestOptions);
    private normalizeCleanerOptions;
    private delay;
    private fetchAllByCursor;
    private runBatchedActions;
    private resolveDateWindows;
    private getCredentialsAndTabKey;
    removeFriends: (options?: ICleanerOptions) => Promise<void>;
    unfollowPages: (options?: ICleanerOptions) => Promise<void>;
    leaveGroups: (options?: ICleanerOptions) => Promise<void>;
    unfollowUsersOrPages: (options?: ICleanerOptions) => Promise<void>;
    cancelSentFriendRequests: (options?: ICleanerOptions) => Promise<void>;
    deletePosts: ({ fromDate, toDate, ...options }: ICleanerOptions & {
        fromDate?: string;
        toDate?: string;
    }) => Promise<void>;
    changePostsPrivacy: ({ privacy, ...options }: ICleanerOptions & {
        privacy: "SELF" | "EVERYONE" | "FRIENDS";
    }) => Promise<void>;
    deleteReactions: ({ fromDate, toDate, ...options }: ICleanerOptions & {
        fromDate?: string;
        toDate?: string;
    }) => Promise<void>;
    deleteComments: ({ fromDate, toDate, ...options }: ICleanerOptions & {
        fromDate?: string;
        toDate?: string;
    }) => Promise<void>;
}

interface IGetStatisticOptions {
    writeToCSV?: boolean;
    savedFilePath?: string;
    limit?: number;
}

declare class FacebookStatistics {
    private facebookRequest;
    constructor(cookies: string, requestOptions?: IRequestOptions);
    private normalizeStatisticOptions;
    private isValidSavedFilePath;
    private fetchAllByCursor;
    getFollowedPages: (options?: IGetStatisticOptions) => Promise<ILikedPages[]>;
    getFriends: (options?: IGetStatisticOptions) => Promise<IFriend[]>;
    getFollowings: (options?: IGetStatisticOptions) => Promise<IFollowing[]>;
    getJoinedGroups: (options?: IGetStatisticOptions) => Promise<IJoinedGroups[]>;
    getSentFriendRequests: (options?: IGetStatisticOptions) => Promise<ISentFriendRequest[]>;
}

export { FacebookCleaner, FacebookStatistics };
