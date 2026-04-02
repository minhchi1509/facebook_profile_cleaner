import dayjs from "dayjs";
import { IGetListResponse } from "src/interfaces/common.interface";
import {
  ICommentData,
  IFollowing,
  IFriend,
  IJoinedGroups,
  ILikedPages,
  IPostData,
  IProfileCredentials,
  IProfileTabKey,
  IReactionData,
  ISentFriendRequest,
} from "src/interfaces/model.interface";
import FacebookRequest from "src/modules/FacebookRequest";
import DateUtils from "src/modules/utils/DateUtils";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrBefore);

interface ICleanerOptions {
  concurrencySize?: number;
  limit?: number;
  delayInMs?: number;
}

interface INormalizedCleanerOptions {
  concurrencySize: number;
  limit: number;
  delayInMs: number;
}

interface IDateWindow {
  month?: number;
  year?: number;
  label: string;
}

class FacebookCleaner {
  private facebookRequest: FacebookRequest;

  constructor(cookies: string) {
    this.facebookRequest = new FacebookRequest(cookies);
  }

  private normalizeCleanerOptions = (
    options: ICleanerOptions | undefined,
    actionName: string,
  ): INormalizedCleanerOptions => {
    const concurrencySize = options?.concurrencySize ?? 5;
    const limit = options?.limit ?? Number.POSITIVE_INFINITY;
    const delayInMs = options?.delayInMs ?? 1000;

    if (!Number.isInteger(concurrencySize) || concurrencySize <= 0) {
      throw new Error(
        `❌ Invalid concurrencySize in ${actionName}: concurrencySize must be a positive integer.`,
      );
    }

    if (!Number.isFinite(limit) && limit !== Number.POSITIVE_INFINITY) {
      throw new Error(
        `❌ Invalid limit in ${actionName}: limit must be a finite number or Infinity.`,
      );
    }

    if (limit < 0) {
      throw new Error(
        `❌ Invalid limit in ${actionName}: limit must be greater than or equal to 0.`,
      );
    }

    if (!Number.isFinite(delayInMs) || delayInMs < 0) {
      throw new Error(
        `❌ Invalid delayInMs in ${actionName}: delayInMs must be greater than or equal to 0.`,
      );
    }

    return {
      concurrencySize,
      limit,
      delayInMs,
    };
  };

  private delay = async (ms: number) => {
    if (ms <= 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, ms));
  };

  private fetchAllByCursor = async <T>({
    limit,
    actionName,
    fetchPage,
  }: {
    limit: number;
    actionName: string;
    fetchPage: (cursor: string) => Promise<IGetListResponse<T>>;
  }): Promise<T[]> => {
    const allItems: T[] = [];
    let cursor = "";
    let pageNumber = 0;
    const targetText = Number.isFinite(limit) ? String(limit) : "unlimited";

    console.log(
      `📥 ${actionName}: Starting fetching items (target: ${targetText}).`,
    );

    while (true) {
      pageNumber += 1;
      const page = await fetchPage(cursor);
      const remainingItems = limit - allItems.length;

      if (remainingItems <= 0) {
        break;
      }

      if (page.data.length > remainingItems) {
        allItems.push(...page.data.slice(0, remainingItems));
      } else {
        allItems.push(...page.data);
      }

      console.log(`📄 ${actionName}: Fetched ${allItems.length} items...`);

      if (!page.pagination.hasMore || allItems.length >= limit) {
        break;
      }

      cursor = page.pagination.nextCursor;
    }

    console.log(
      `✅ ${actionName}: Completed fetching ${allItems.length} items.`,
    );

    return allItems;
  };

  private runBatchedActions = async <T>({
    items,
    options,
    actionName,
    runAction,
  }: {
    items: T[];
    options: INormalizedCleanerOptions;
    actionName: string;
    runAction: (item: T) => Promise<void>;
  }) => {
    const totalItems = items.length;
    if (totalItems === 0) {
      console.log(`✅ ${actionName}: No item to process.`);
      return;
    }

    console.log(`🚀 ${actionName}: Start processing ${totalItems} item(s).`);

    let processedItems = 0;
    for (
      let startIndex = 0;
      startIndex < items.length;
      startIndex += options.concurrencySize
    ) {
      const currentBatch = items.slice(
        startIndex,
        startIndex + options.concurrencySize,
      );

      await Promise.all(currentBatch.map((item) => runAction(item)));

      processedItems += currentBatch.length;
      console.log(
        `🏃‍♂️‍➡️ ${actionName}: Processed ${processedItems}/${totalItems} items...`,
      );

      if (processedItems < totalItems) {
        await this.delay(options.delayInMs);
      }
    }

    console.log(
      `✅ ${actionName}: Completed ${processedItems}/${totalItems} items.`,
    );
  };

  private resolveDateWindows = (
    fromDate?: string,
    toDate?: string,
  ): IDateWindow[] => {
    const hasFromDate = !!fromDate?.trim();
    const hasToDate = !!toDate?.trim();

    if (hasFromDate !== hasToDate) {
      throw new Error(
        "❌ Invalid date input. Both fromDate and toDate are required when filtering by date.",
      );
    }

    if (!hasFromDate && !hasToDate) {
      return [{ label: "all_time" }];
    }

    const fromDateValue = fromDate as string;
    const toDateValue = toDate as string;
    if (!DateUtils.isValidTwoDate(fromDateValue, toDateValue)) {
      throw new Error(
        "❌ Invalid date input. Start date must be before or equal to end date and it must be in MM/YYYY format.",
      );
    }

    const windows: IDateWindow[] = [];
    const startDate = DateUtils.stringFormatToDate(fromDateValue);
    const endDate = DateUtils.stringFormatToDate(toDateValue);

    for (
      let currentDate = startDate;
      currentDate.isSameOrBefore(endDate);
      currentDate = dayjs(currentDate).add(1, "month")
    ) {
      const month = currentDate.month() + 1;
      const year = currentDate.year();
      windows.push({
        month,
        year,
        label: `${month}/${year}`,
      });
    }

    return windows;
  };

  private getCredentialsAndTabKey = async (): Promise<{
    profileCredentials: IProfileCredentials;
    profileTabKey: IProfileTabKey;
  }> => {
    const profileCredentials =
      await this.facebookRequest.getProfileCredentials();
    const profileTabKey =
      await this.facebookRequest.getProfileTabKey(profileCredentials);

    return {
      profileCredentials,
      profileTabKey,
    };
  };

  removeFriends = async (options: ICleanerOptions = {}) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "removeFriends",
    );
    const { profileCredentials, profileTabKey } =
      await this.getCredentialsAndTabKey();

    const friends = await this.fetchAllByCursor<IFriend>({
      limit: normalizedOptions.limit,
      actionName: "removeFriends",
      fetchPage: (cursor) =>
        this.facebookRequest.getFriends({
          cursor,
          profileCredentials,
          profileTabKey,
        }),
    });

    await this.runBatchedActions({
      items: friends,
      options: normalizedOptions,
      actionName: "removeFriends",
      runAction: (friend) =>
        this.facebookRequest.unfriend({
          profileCredentials,
          friendId: friend.id,
        }),
    });
  };

  unfollowPages = async (options: ICleanerOptions = {}) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "unfollowPages",
    );
    const profileCredentials =
      await this.facebookRequest.getProfileCredentials();

    const followedPages = await this.fetchAllByCursor<ILikedPages>({
      limit: normalizedOptions.limit,
      actionName: "unfollowPages",
      fetchPage: (cursor) =>
        this.facebookRequest.getFollowedPages({
          cursor,
          profileCredentials,
        }),
    });

    await this.runBatchedActions({
      items: followedPages,
      options: normalizedOptions,
      actionName: "unfollowPages",
      runAction: (page) =>
        this.facebookRequest.unfollowPage({
          profileCredentials,
          pageId: page.id,
        }),
    });
  };

  leaveGroups = async (options: ICleanerOptions = {}) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "leaveGroups",
    );
    const profileCredentials =
      await this.facebookRequest.getProfileCredentials();

    const joinedGroups = await this.fetchAllByCursor<IJoinedGroups>({
      limit: normalizedOptions.limit,
      actionName: "leaveGroups",
      fetchPage: (cursor) =>
        this.facebookRequest.getJoinedGroups({
          cursor,
          profileCredentials,
        }),
    });

    await this.runBatchedActions({
      items: joinedGroups,
      options: normalizedOptions,
      actionName: "leaveGroups",
      runAction: (group) =>
        this.facebookRequest.leaveGroup({
          profileCredentials,
          groupId: group.id,
        }),
    });
  };

  unfollowUsersOrPages = async (options: ICleanerOptions = {}) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "unfollowUsersOrPages",
    );
    const { profileCredentials, profileTabKey } =
      await this.getCredentialsAndTabKey();

    const followings = await this.fetchAllByCursor<IFollowing>({
      limit: normalizedOptions.limit,
      actionName: "unfollowUsersOrPages",
      fetchPage: (cursor) =>
        this.facebookRequest.getFollowing({
          cursor,
          profileCredentials,
          profileTabKey,
        }),
    });

    await this.runBatchedActions({
      items: followings,
      options: normalizedOptions,
      actionName: "unfollowUsersOrPages",
      runAction: (following) =>
        this.facebookRequest.unfollowUserOrPage({
          profileCredentials,
          userOrPageId: following.id,
        }),
    });
  };

  cancelSentFriendRequests = async (options: ICleanerOptions = {}) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "cancelSentFriendRequests",
    );
    const profileCredentials =
      await this.facebookRequest.getProfileCredentials();

    const sentFriendRequests = await this.fetchAllByCursor<ISentFriendRequest>({
      limit: normalizedOptions.limit,
      actionName: "cancelSentFriendRequests",
      fetchPage: (cursor) =>
        this.facebookRequest.getSentFriendRequests({
          cursor,
          profileCredentials,
        }),
    });

    await this.runBatchedActions({
      items: sentFriendRequests,
      options: normalizedOptions,
      actionName: "cancelSentFriendRequests",
      runAction: (request) =>
        this.facebookRequest.cancelSentFriendRequest({
          profileCredentials,
          userId: request.id,
        }),
    });
  };

  deletePosts = async ({
    fromDate,
    toDate,
    ...options
  }: ICleanerOptions & { fromDate?: string; toDate?: string }) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "deletePosts",
    );
    const profileCredentials =
      await this.facebookRequest.getProfileCredentials();
    const dateWindows = this.resolveDateWindows(fromDate, toDate);

    let remainingLimit = normalizedOptions.limit;
    let totalDeleted = 0;

    for (const dateWindow of dateWindows) {
      if (remainingLimit <= 0) {
        break;
      }

      const postsData = await this.fetchAllByCursor<IPostData>({
        limit: remainingLimit,
        actionName: `deletePosts (${dateWindow.label})`,
        fetchPage: (cursor) =>
          this.facebookRequest.getPostsData({
            cursor,
            profileCredentials,
            month: dateWindow.month,
            year: dateWindow.year,
          }),
      });

      await this.runBatchedActions({
        items: postsData,
        options: {
          ...normalizedOptions,
          limit: remainingLimit,
        },
        actionName: `deletePosts (${dateWindow.label})`,
        runAction: (postData) =>
          this.facebookRequest.deletePost({
            profileCredentials,
            postData,
          }),
      });

      totalDeleted += postsData.length;
      if (Number.isFinite(remainingLimit)) {
        remainingLimit -= postsData.length;
      }
    }

    if (Number.isFinite(normalizedOptions.limit)) {
      console.log(
        `✅ DeletePosts overall: ${totalDeleted}/${normalizedOptions.limit}.`,
      );
    } else {
      console.log(`✅ DeletePosts overall: ${totalDeleted} item(s).`);
    }
  };

  changePostsPrivacy = async ({
    privacy,
    ...options
  }: ICleanerOptions & { privacy: "SELF" | "EVERYONE" | "FRIENDS" }) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "changePostsPrivacy",
    );
    const profileCredentials =
      await this.facebookRequest.getProfileCredentials();

    const profilePostIds = await this.fetchAllByCursor<IPostData>({
      limit: normalizedOptions.limit,
      actionName: "changePostsPrivacy",
      fetchPage: (cursor) =>
        this.facebookRequest.getPostsData({
          cursor,
          profileCredentials,
        }),
    });

    await this.runBatchedActions({
      items: profilePostIds,
      options: normalizedOptions,
      actionName: "changePostsPrivacy",
      runAction: (postData) =>
        this.facebookRequest.changePostPrivacy({
          profileCredentials,
          postId: postData.postId,
          privacy,
        }),
    });
  };

  deleteReactions = async ({
    fromDate,
    toDate,
    ...options
  }: ICleanerOptions & { fromDate?: string; toDate?: string }) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "deleteReactions",
    );
    const profileCredentials =
      await this.facebookRequest.getProfileCredentials();
    const dateWindows = this.resolveDateWindows(fromDate, toDate);

    let remainingLimit = normalizedOptions.limit;
    let totalDeleted = 0;

    for (const dateWindow of dateWindows) {
      if (remainingLimit <= 0) {
        break;
      }

      const reactionsData = await this.fetchAllByCursor<IReactionData>({
        limit: remainingLimit,
        actionName: `deleteReactions (${dateWindow.label})`,
        fetchPage: (cursor) =>
          this.facebookRequest.getReactionData({
            cursor,
            profileCredentials,
            month: dateWindow.month,
            year: dateWindow.year,
          }),
      });

      await this.runBatchedActions({
        items: reactionsData,
        options: {
          ...normalizedOptions,
          limit: remainingLimit,
        },
        actionName: `deleteReactions (${dateWindow.label})`,
        runAction: (reactionData) =>
          this.facebookRequest.deleteReaction({
            profileCredentials,
            reactionData,
          }),
      });

      totalDeleted += reactionsData.length;
      if (Number.isFinite(remainingLimit)) {
        remainingLimit -= reactionsData.length;
      }
    }

    if (Number.isFinite(normalizedOptions.limit)) {
      console.log(
        `✅ DeleteReactions overall: ${totalDeleted}/${normalizedOptions.limit}.`,
      );
    } else {
      console.log(`✅ DeleteReactions overall: ${totalDeleted} item(s).`);
    }
  };

  deleteComments = async ({
    fromDate,
    toDate,
    ...options
  }: ICleanerOptions & { fromDate?: string; toDate?: string }) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "deleteComments",
    );
    const profileCredentials =
      await this.facebookRequest.getProfileCredentials();
    const dateWindows = this.resolveDateWindows(fromDate, toDate);

    let remainingLimit = normalizedOptions.limit;
    let totalDeleted = 0;

    for (const dateWindow of dateWindows) {
      if (remainingLimit <= 0) {
        break;
      }

      const commentsData = await this.fetchAllByCursor<ICommentData>({
        limit: remainingLimit,
        actionName: `deleteComments (${dateWindow.label})`,
        fetchPage: (cursor) =>
          this.facebookRequest.getCommentData({
            cursor,
            profileCredentials,
            month: dateWindow.month,
            year: dateWindow.year,
          }),
      });

      await this.runBatchedActions({
        items: commentsData,
        options: {
          ...normalizedOptions,
          limit: remainingLimit,
        },
        actionName: `deleteComments (${dateWindow.label})`,
        runAction: (commentData) =>
          this.facebookRequest.deleteComment({
            profileCredentials,
            commentData,
          }),
      });

      totalDeleted += commentsData.length;
      if (Number.isFinite(remainingLimit)) {
        remainingLimit -= commentsData.length;
      }
    }

    if (Number.isFinite(normalizedOptions.limit)) {
      console.log(
        `✅ DeleteComments overall: ${totalDeleted}/${normalizedOptions.limit}.`,
      );
    } else {
      console.log(`✅ DeleteComments overall: ${totalDeleted} item(s).`);
    }
  };
}

export default FacebookCleaner;
