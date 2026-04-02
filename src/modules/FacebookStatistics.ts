import path from "path";
import {
  IGetListResponse,
  IRequestOptions,
} from "src/interfaces/common.interface";
import {
  IFriend,
  IFollowing,
  IJoinedGroups,
  ILikedPages,
  IProfileCredentials,
  ISentFriendRequest,
  IProfileTabKey,
} from "src/interfaces/model.interface";
import { IGetStatisticOptions } from "src/interfaces/statistic.interface";
import FacebookRequest from "src/modules/FacebookRequest";
import FileUtils from "src/modules/utils/FileUtils";

type IFetchPageFn<T> = (params: {
  cursor: string;
  profileCredentials: IProfileCredentials;
  profileTabKey?: IProfileTabKey;
}) => Promise<IGetListResponse<T>>;

interface INormalizedStatisticOptions {
  writeToCSV: boolean;
  savedFilePath?: string;
  limit: number;
}

class FacebookStatistics {
  private facebookRequest: FacebookRequest;

  constructor(cookies: string, requestOptions?: IRequestOptions) {
    this.facebookRequest = new FacebookRequest(cookies, requestOptions);
  }

  private normalizeStatisticOptions = (
    options: IGetStatisticOptions | undefined,
    statisticName: string,
  ): INormalizedStatisticOptions => {
    const writeToCSV = options?.writeToCSV ?? false;
    const savedFilePath = options?.savedFilePath?.trim();
    const limit = options?.limit ?? Number.POSITIVE_INFINITY;

    if (!Number.isFinite(limit) && limit !== Number.POSITIVE_INFINITY) {
      throw new Error(
        `❌ Invalid limit in ${statisticName}: limit must be a number`,
      );
    }

    if (limit < 0) {
      throw new Error(
        `❌ Invalid limit in ${statisticName}: limit must be greater than or equal to 0`,
      );
    }

    if (writeToCSV && !savedFilePath) {
      throw new Error(
        `❌ Invalid options in ${statisticName}: savedFilePath is required when writeToCSV is true`,
      );
    }

    if (savedFilePath && !this.isValidSavedFilePath(savedFilePath)) {
      throw new Error(
        `❌ Invalid savedFilePath in ${statisticName}: ${savedFilePath}`,
      );
    }

    return {
      writeToCSV,
      savedFilePath,
      limit,
    };
  };

  private isValidSavedFilePath = (savedFilePath: string): boolean => {
    const normalizedPath = path.normalize(savedFilePath);
    const strippedDrivePrefix = normalizedPath.replace(/^[a-zA-Z]:/, "");
    const hasInvalidChars = /[<>:"|?*]/.test(strippedDrivePrefix);
    const fileName = path.basename(normalizedPath);

    return (
      !hasInvalidChars &&
      fileName.length > 0 &&
      fileName !== "." &&
      fileName !== ".."
    );
  };

  private fetchAllByCursor = async <T>({
    options,
    statisticName,
    fetchPage,
    needProfileTabKey = false,
  }: {
    options?: IGetStatisticOptions;
    statisticName: string;
    fetchPage: IFetchPageFn<T>;
    needProfileTabKey?: boolean;
  }): Promise<T[]> => {
    const normalizedOptions = this.normalizeStatisticOptions(
      options,
      statisticName,
    );
    const profileCredentials =
      await this.facebookRequest.getProfileCredentials();
    const profileTabKey = needProfileTabKey
      ? await this.facebookRequest.getProfileTabKey(profileCredentials)
      : undefined;

    const allItems: T[] = [];
    let cursor = "";

    while (true) {
      const response = await fetchPage({
        cursor,
        profileCredentials,
        profileTabKey,
      });
      const remainingItems = normalizedOptions.limit - allItems.length;

      if (remainingItems <= 0) {
        break;
      }

      if (response.data.length > remainingItems) {
        allItems.push(...response.data.slice(0, remainingItems));
      } else {
        allItems.push(...response.data);
      }

      console.log(
        `🚀 Fetched ${allItems.length} items from ${statisticName}...`,
      );

      if (
        allItems.length >= normalizedOptions.limit ||
        !response.pagination.hasMore
      ) {
        break;
      }

      cursor = response.pagination.nextCursor;
    }

    console.log(
      `✅ Fetched total ${allItems.length} items from ${statisticName} successfully.`,
    );

    if (normalizedOptions.writeToCSV && normalizedOptions.savedFilePath) {
      await FileUtils.writeCSV(normalizedOptions.savedFilePath, allItems);
    }

    return allItems;
  };

  getFollowedPages = async (
    options?: IGetStatisticOptions,
  ): Promise<ILikedPages[]> => {
    return this.fetchAllByCursor({
      options,
      statisticName: "getFollowedPages",
      fetchPage: ({ cursor, profileCredentials }) =>
        this.facebookRequest.getFollowedPages({
          cursor,
          profileCredentials,
        }),
    });
  };

  getFriends = async (options?: IGetStatisticOptions): Promise<IFriend[]> => {
    return this.fetchAllByCursor({
      options,
      statisticName: "getFriends",
      needProfileTabKey: true,
      fetchPage: ({ cursor, profileCredentials, profileTabKey }) =>
        this.facebookRequest.getFriends({
          cursor,
          profileCredentials,
          profileTabKey,
        }),
    });
  };

  getFollowings = async (
    options?: IGetStatisticOptions,
  ): Promise<IFollowing[]> => {
    return this.fetchAllByCursor({
      options,
      statisticName: "getFollowings",
      needProfileTabKey: true,
      fetchPage: ({ cursor, profileCredentials, profileTabKey }) =>
        this.facebookRequest.getFollowing({
          cursor,
          profileCredentials,
          profileTabKey,
        }),
    });
  };

  getJoinedGroups = async (
    options?: IGetStatisticOptions,
  ): Promise<IJoinedGroups[]> => {
    return this.fetchAllByCursor({
      options,
      statisticName: "getJoinedGroups",
      fetchPage: ({ cursor, profileCredentials }) =>
        this.facebookRequest.getJoinedGroups({
          cursor,
          profileCredentials,
        }),
    });
  };

  getSentFriendRequests = async (
    options?: IGetStatisticOptions,
  ): Promise<ISentFriendRequest[]> => {
    return this.fetchAllByCursor({
      options,
      statisticName: "getSentFriendRequests",
      fetchPage: ({ cursor, profileCredentials }) =>
        this.facebookRequest.getSentFriendRequests({
          cursor,
          profileCredentials,
        }),
    });
  };
}

export default FacebookStatistics;
