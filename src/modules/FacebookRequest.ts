import axios, { AxiosError, AxiosInstance } from "axios";
import {
  ICachedCursor,
  ICommentData,
  ICurrentUserToken,
  IFollowing,
  IFriend,
  IJoinedGroups,
  ILikedPages,
  IReactionData,
  ISentFriendRequest,
} from "src/interfaces";
import CacheCursor from "src/modules/utils/CacheCursor";
import FileUtils from "src/modules/utils/FileUtils";
import PathUtils from "src/modules/utils/PathUtils";

class FacebookRequest {
  private axiosInstance: AxiosInstance;

  constructor(cookies: string) {
    this.axiosInstance = axios.create({
      baseURL: "https://www.facebook.com/api/graphql",
      headers: { cookie: cookies },
    });
    this.axiosInstance.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        if (error.response) {
          const responseData = error.response.data;
          throw new Error(
            `❌ Error when making request to Instagram: ${JSON.stringify(
              responseData,
              null,
              2
            )}`
          );
        }
        throw new Error(`❌ Unknown error: ${error.message}`);
      }
    );
  }

  getCurrentUserToken = async () => {
    try {
      const { data } = await this.axiosInstance.get(
        "https://www.facebook.com/"
      );
      const userId = data.match(/"userId":(\d+)/)[1];
      const fbDtsg = data.match(/"DTSGInitialData".*?"token":"(.*?)"/)[1];
      return { userId, fbDtsg };
    } catch (error) {
      throw new Error(
        "❌ Error when getting your Facebook token: Invalid cookie"
      );
    }
  };

  private makeRequestToFacebook = async (
    userToken: ICurrentUserToken,
    docID: string,
    query: any
  ) => {
    const formData = new FormData();
    formData.set("fb_dtsg", userToken.fbDtsg);
    formData.set("av", userToken.userId);
    formData.set("doc_id", docID);
    formData.set("variables", JSON.stringify(query));
    const { data } = await this.axiosInstance.post("/", formData);
    return data;
  };

  getAllLikedPages = async (writeToCSV: boolean = false) => {
    const userToken = await this.getCurrentUserToken();
    const allLikedPages: ILikedPages[] = [];
    console.log("🚀 Start getting liked pages...");
    const baseQuery = {
      ranking_model: "INTEGRITY_SIGNALS",
      scale: 1,
      id: userToken.userId,
      __relay_internal__pv__StoriesRingrelayprovider: false,
    };

    let hasNextPage = false;
    let endCursor = "";
    do {
      const docID = "8407760875943054";
      const query = {
        ...baseQuery,
        ...(allLikedPages.length && { count: 20, cursor: endCursor }),
      };

      const responseData = await this.makeRequestToFacebook(
        userToken,
        docID,
        query
      );

      const originalLikedPagesList =
        responseData?.data?.node?.sorted_liked_and_followed_pages?.edges;
      const pageInfor =
        responseData?.data?.node?.sorted_liked_and_followed_pages?.page_info;
      if (!originalLikedPagesList || !pageInfor) {
        console.log("😐 There are some errors. Start retrying...");
        continue;
      }

      const likedPages = originalLikedPagesList.map(({ node }: any) => ({
        id: node.id,
        name: node.name,
        url: node.url,
      }));
      allLikedPages.push(...likedPages);
      console.log(`🔥 Got ${allLikedPages.length} liked pages...`);
      hasNextPage = pageInfor.has_next_page;
      endCursor = pageInfor.end_cursor;
    } while (hasNextPage);
    console.log(
      `✅ Get all liked pages successfully. Total: ${allLikedPages.length}`
    );
    if (writeToCSV && allLikedPages.length) {
      const { LIKED_PAGES } = PathUtils.getSavedProfileStatisticsDirPath(
        userToken.userId
      );
      await FileUtils.writeCSV(
        LIKED_PAGES,
        allLikedPages.map((page, index) => ({
          ordinal_number: index + 1,
          ...page,
        }))
      );
    }
    return allLikedPages;
  };

  getAllFriends = async (writeToCSV: boolean = false) => {
    const userToken = await this.getCurrentUserToken();
    const allFriends: IFriend[] = [];
    console.log("🚀 Start getting friends...");
    const baseQuery = {
      scale: 1,
    };
    let hasNextPage = false;
    let endCursor = "";
    do {
      const docID = "27405320069114034";
      const query = {
        ...baseQuery,
        ...(allFriends.length && { count: 30, cursor: endCursor }),
      };

      const responseData = await this.makeRequestToFacebook(
        userToken,
        docID,
        query
      );

      const originalFriendsList = responseData?.data?.viewer?.all_friends.edges;
      const pageInfor = responseData?.data?.viewer?.all_friends?.page_info;
      if (!originalFriendsList || !pageInfor) {
        console.log("😐 There are some errors. Start retrying...");
        continue;
      }

      const friends = originalFriendsList.map(({ node }: any) => ({
        id: node.id,
        name: node.name,
        url: node.url,
      }));

      allFriends.push(...friends);
      console.log(`🔥 Got ${allFriends.length} friends...`);
      hasNextPage = pageInfor.has_next_page;
      endCursor = pageInfor.end_cursor;
    } while (hasNextPage);
    console.log(`✅ Get all friends successfully. Total: ${allFriends.length}`);
    if (writeToCSV && allFriends.length) {
      const { FRIENDS } = PathUtils.getSavedProfileStatisticsDirPath(
        userToken.userId
      );
      await FileUtils.writeCSV(
        FRIENDS,
        allFriends.map((friend, index) => ({
          ordinal_number: index + 1,
          ...friend,
        }))
      );
    }
    return allFriends;
  };

  getAllFollowing = async (writeToCSV: boolean = false) => {
    const userToken = await this.getCurrentUserToken();
    const allFollowings: IFollowing[] = [];
    console.log("🚀 Start getting following...");
    const baseQuery = {
      scale: 1,
      id: btoa(`app_collection:${userToken.userId}:2356318349:33`),
    };
    let hasNextPage = false;
    let endCursor = "";
    do {
      const docID = "8512257125510319";
      const query = {
        ...baseQuery,
        ...(allFollowings.length && { count: 8, cursor: endCursor }),
      };

      const responseData = await this.makeRequestToFacebook(
        userToken,
        docID,
        query
      );

      const originalFollowingList = responseData?.data?.node?.pageItems?.edges;
      const pageInfor = responseData?.data?.node?.pageItems?.page_info;
      if (!originalFollowingList || !pageInfor) {
        console.log("😐 There are some errors. Start retrying...");
        continue;
      }

      const following = originalFollowingList.map(({ node }: any) => ({
        id: node.node.id,
        name: node.title.text,
        url: node.url,
      }));

      allFollowings.push(...following);
      console.log(`🔥 Got ${allFollowings.length} following...`);
      hasNextPage = pageInfor.has_next_page;
      endCursor = pageInfor.end_cursor;
    } while (hasNextPage);
    console.log(
      `✅ Get all following successfully. Total: ${allFollowings.length}`
    );
    if (writeToCSV && allFollowings.length) {
      const { FOLLOWING } = PathUtils.getSavedProfileStatisticsDirPath(
        userToken.userId
      );
      await FileUtils.writeCSV(
        FOLLOWING,
        allFollowings.map((following, index) => ({
          ordinal_number: index + 1,
          ...following,
        }))
      );
    }
    return allFollowings;
  };

  getAllJoinedGroups = async (writeToCSV: boolean = false) => {
    const userToken = await this.getCurrentUserToken();
    const allJoinedGroups: IJoinedGroups[] = [];
    console.log("🚀 Start getting joined groups...");
    const baseQuery = {
      ordering: ["integrity_signals"],
      scale: 1,
    };

    let hasNextPage = false;
    let endCursor = "";
    do {
      const docID = "6009728632468556";
      const query = {
        ...baseQuery,
        ...(allJoinedGroups.length && { count: 20, cursor: endCursor }),
      };

      const responseData = await this.makeRequestToFacebook(
        userToken,
        docID,
        query
      );

      const originalJoinedGroupsList =
        responseData?.data?.viewer?.all_joined_groups?.tab_groups_list?.edges;
      const pageInfor =
        responseData?.data?.viewer?.all_joined_groups?.tab_groups_list
          ?.page_info;
      if (!originalJoinedGroupsList || !pageInfor) {
        console.log("😐 There are some errors. Start retrying...");
        continue;
      }

      const joinedGroups = originalJoinedGroupsList.map(({ node }: any) => ({
        id: node.id,
        name: node.name,
        url: node.url,
      }));
      allJoinedGroups.push(...joinedGroups);
      console.log(`🔥 Got ${allJoinedGroups.length} joined groups...`);
      hasNextPage = pageInfor.has_next_page;
      endCursor = pageInfor.end_cursor;
    } while (hasNextPage);
    console.log(
      `✅ Get all joined groups successfully. Total: ${allJoinedGroups.length}`
    );
    if (writeToCSV && allJoinedGroups.length) {
      const { JOINED_GROUPS } = PathUtils.getSavedProfileStatisticsDirPath(
        userToken.userId
      );
      await FileUtils.writeCSV(
        JOINED_GROUPS,
        allJoinedGroups.map((group, index) => ({
          ordinal_number: index + 1,
          ...group,
        }))
      );
    }
    return allJoinedGroups;
  };

  getAllSentFriendRequests = async (writeToCSV: boolean = false) => {
    const userToken = await this.getCurrentUserToken();
    const allSentFriendRequests: ISentFriendRequest[] = [];
    console.log("🚀 Start getting sent friend requests...");
    const baseQuery = {
      scale: 1,
    };

    let hasNextPage = false;
    let endCursor = "";
    do {
      const docID = "4420916318007844";
      const query = {
        ...baseQuery,
        ...(allSentFriendRequests.length && { count: 10, cursor: endCursor }),
      };

      const responseData = await this.makeRequestToFacebook(
        userToken,
        docID,
        query
      );

      const originalSentFriendRequests =
        responseData?.data?.viewer?.outgoing_friend_requests_connection?.edges;
      const pageInfor =
        responseData?.data?.viewer?.outgoing_friend_requests_connection
          ?.page_info;
      if (!originalSentFriendRequests || !pageInfor) {
        console.log("😐 There are some errors. Start retrying...");
        continue;
      }

      const sentFriendRequests = originalSentFriendRequests.map(
        ({ node }: any) => ({
          id: node.id,
          name: node.name,
          url: node.url,
        })
      );
      allSentFriendRequests.push(...sentFriendRequests);
      console.log(
        `🔥 Got ${allSentFriendRequests.length} sent friend requests...`
      );
      hasNextPage = pageInfor.has_next_page;
      endCursor = pageInfor.end_cursor;
    } while (hasNextPage);
    console.log(
      `✅ Get all sent friend requests successfully. Total: ${allSentFriendRequests.length}`
    );
    if (writeToCSV && allSentFriendRequests.length) {
      const { SENT_FRIEND_REQUESTS } =
        PathUtils.getSavedProfileStatisticsDirPath(userToken.userId);
      await FileUtils.writeCSV(
        SENT_FRIEND_REQUESTS,
        allSentFriendRequests.map((request, index) => ({
          ordinal_number: index + 1,
          ...request,
        }))
      );
    }
    return allSentFriendRequests;
  };

  getProfilePostsId = async (
    userToken: ICurrentUserToken,
    startCursor: string,
    totalFetchedPostsId: number,
    limit: number
  ) => {
    const postsId: string[] = [];
    console.log(
      `🚀 Start getting posts id. Fetched ${totalFetchedPostsId}. Maximum: ${limit}`
    );
    let hasNextPage = false;
    let endCursor = startCursor;
    const baseQuery = {
      afterTime: null,
      beforeTime: null,
      count: 3,
      omitPinnedPost: true,
      privacy: null,
      scale: 1,
      id: userToken.userId,
    };
    const postIdRegex = /"post_id":"(.*?)","cix_screen":/g;
    const pageInforRegex = /"data":\{"page_info":(.*?)\},"extensions"/;
    do {
      const docID = "8687710371346343";
      const query = {
        ...baseQuery,
        cursor: endCursor,
      };
      const responseText = await this.makeRequestToFacebook(
        userToken,
        docID,
        query
      );

      const postsIdTemp: string[] = [];
      const pageInfoInText = pageInforRegex.exec(responseText)?.[1];
      if (!pageInfoInText) {
        console.log("😐 There are some errors. Start retrying...");
        continue;
      }
      const pageInfo = JSON.parse(pageInfoInText);
      let match;
      while ((match = postIdRegex.exec(responseText)) !== null) {
        if (match[1] && match[1].length < 30) {
          postsIdTemp.push(match[1]);
        }
      }
      postsId.push(...postsIdTemp);
      console.log(`🔥 Got ${postsId.length} posts id...`);
      hasNextPage = pageInfo.has_next_page;
      endCursor = pageInfo.end_cursor;
    } while (hasNextPage && postsId.length < limit);

    const cacheCursorInfor: ICachedCursor = {
      nextCursor: hasNextPage ? endCursor : "",
      totalFetchedItems: hasNextPage ? totalFetchedPostsId + postsId.length : 0,
    };
    CacheCursor.writeCacheCursor(
      userToken.userId,
      "POSTS_ID",
      cacheCursorInfor
    );
    hasNextPage
      ? console.log(
          `🔃 Got ${postsId.length} posts id and still have posts id left`
        )
      : console.log(
          `✅ Get posts id of current user successfully. Total: ${
            postsId.length + totalFetchedPostsId
          }`
        );

    return postsId;
  };

  getReactionData = async (
    userToken: ICurrentUserToken,
    month: number,
    year: number
  ) => {
    const result: IReactionData[] = [];
    let hasNextPage = false;
    let endCursor = "";
    const baseQuery = {
      audience: null,
      category: "LIKEDPOSTS",
      category_key: "LIKEDPOSTS",
      count: 25,
      feedLocation: null,
      media_content_filters: [],
      month,
      person_id: null,
      privacy: "NONE",
      scale: 1,
      timeline_visibility: "ALL",
      year,
      id: userToken.userId,
    };
    console.log(`\n🚀 Start getting reactions in ${month}/${year}.`);
    do {
      const docID = "27684299287850969";
      const query = {
        ...baseQuery,
        cursor: endCursor,
      };
      let responseData = await this.makeRequestToFacebook(
        userToken,
        docID,
        query
      );
      if (typeof responseData !== "object") {
        responseData = JSON.parse(responseData.split("\n")[0]);
      }

      const originalReactionsData =
        responseData?.data?.node?.activity_log_stories?.edges;
      const pageInfor =
        responseData?.data?.node?.activity_log_stories?.page_info;
      if (!originalReactionsData || !pageInfor) {
        console.log(
          `😐 There are some errors when getting reactions in ${month}/${year}. Start retrying...`
        );
        continue;
      }
      const reactionsData: IReactionData[] = originalReactionsData
        .map((post: any) => {
          const postNode = post.node;
          if (!postNode.id || !postNode.post_id) {
            return undefined;
          }
          return {
            storyId: postNode.id,
            postId: postNode.post_id,
          };
        })
        .filter((reaction: any) => !!reaction);
      result.push(...reactionsData);
      console.log(`🔥 Got ${result.length} reactions...`);
      hasNextPage = pageInfor.has_next_page;
      endCursor = pageInfor.end_cursor;
    } while (hasNextPage);
    console.log(
      `✅ Got all reactions in ${month}/${year} successfully. Total: ${result.length}`
    );

    return result;
  };

  getCommentData = async (
    userToken: ICurrentUserToken,
    month: number,
    year: number
  ) => {
    const result: ICommentData[] = [];
    let hasNextPage = false;
    let endCursor = "";
    const baseQuery = {
      audience: null,
      category: "COMMENTSCLUSTER",
      category_key: "COMMENTSCLUSTER",
      count: 25,
      feedLocation: null,
      media_content_filters: [],
      month,
      person_id: null,
      privacy: "NONE",
      scale: 1,
      timeline_visibility: "ALL",
      year,
      id: userToken.userId,
    };
    console.log(`\n🚀 Start getting comments in ${month}/${year}.`);
    do {
      const docID = "27684299287850969";
      const query = {
        ...baseQuery,
        cursor: endCursor,
      };
      let responseData = await this.makeRequestToFacebook(
        userToken,
        docID,
        query
      );
      if (typeof responseData !== "object") {
        responseData = JSON.parse(responseData.split("\n")[0]);
      }

      const originalCommentsData =
        responseData?.data?.node?.activity_log_stories?.edges;
      const pageInfor =
        responseData?.data?.node?.activity_log_stories?.page_info;
      if (!originalCommentsData || !pageInfor) {
        console.log(
          `😐 There are some errors when getting comments in ${month}/${year}. Start retrying...`
        );
        continue;
      }
      const commentsData: ICommentData[] = originalCommentsData
        .map((post: any) => {
          const postNode = post.node;
          if (!postNode.id || !postNode.post_id) {
            return undefined;
          }
          return {
            storyId: postNode.id,
            postId: postNode.post_id,
          };
        })
        .filter((comment: any) => !!comment);
      result.push(...commentsData);
      console.log(`🔥 Got ${result.length} comments...`);
      hasNextPage = pageInfor.has_next_page;
      endCursor = pageInfor.end_cursor;
    } while (hasNextPage);
    console.log(
      `✅ Got all comments in ${month}/${year} successfully. Total: ${result.length}`
    );

    return result;
  };

  removeAllFriends = async (batchSize: number) => {
    const allFriends = await this.getAllFriends();
    const userToken = await this.getCurrentUserToken();
    console.log("\n🚀 Start removing all friends...");
    for (let i = 0; i < allFriends.length; i += batchSize) {
      const from = i;
      const to = Math.min(i + batchSize, allFriends.length);
      const friendIDs = allFriends.slice(from, to).map((friend) => friend.id);
      await Promise.all(
        friendIDs.map(async (friendID) => {
          const responseData = await this.makeRequestToFacebook(
            userToken,
            "8752443744796374",
            {
              input: {
                source: "bd_profile_button",
                unfriended_user_id: friendID,
                actor_id: userToken.userId,
                client_mutation_id: "1",
              },
              scale: 1,
            }
          );
          if (!responseData?.data?.friend_remove?.unfriended_person?.id) {
            throw new Error(
              `❌ Error when removing friend with ID ${friendID}.`
            );
          }
        })
      );
      console.log(`🔥 Removed ${to}/${allFriends.length} friends...`);
    }
    console.log("✅ Removed all friends successfully");
  };

  removeAllLikedPages = async (batchSize: number) => {
    const allLikedPages = await this.getAllLikedPages();
    const userToken = await this.getCurrentUserToken();
    console.log("\n🚀 Start removing all liked pages...");
    for (let i = 0; i < allLikedPages.length; i += batchSize) {
      const from = i;
      const to = Math.min(i + batchSize, allLikedPages.length);
      const pageIDs = allLikedPages.slice(from, to).map((page) => page.id);
      await Promise.all(
        pageIDs.map(async (pageID) => {
          const docID = "5358677870817645";
          const query = {
            input: {
              page_id: pageID,
              actor_id: userToken.userId,
              source: "page_profile",
              client_mutation_id: "1",
            },
            scale: 1,
          };
          const responseData = await this.makeRequestToFacebook(
            userToken,
            docID,
            query
          );

          if (
            !responseData?.data?.page_unlike.page
              ?.profile_plus_for_delegate_page?.id
          ) {
            throw new Error(
              `❌ Error when removing liked page with ID ${pageID}.`
            );
          }
        })
      );
      console.log(`🔥 Removed ${to}/${allLikedPages.length} liked pages...`);
    }
    console.log("✅ Removed all liked pages successfully");
  };

  leaveAllJoinedGroups = async (batchSize: number) => {
    const allJoinedGroups = await this.getAllJoinedGroups();
    const userToken = await this.getCurrentUserToken();
    console.log("\n🚀 Start leaving all joined groups...");
    for (let i = 0; i < allJoinedGroups.length; i += batchSize) {
      const from = i;
      const to = Math.min(i + batchSize, allJoinedGroups.length);
      const groupIDs = allJoinedGroups.slice(from, to).map((group) => group.id);
      await Promise.all(
        groupIDs.map(async (groupID) => {
          const docID = "7925432007559878";
          const query = {
            groupID: groupID,
            input: {
              action_source: "COMET_GROUP_PAGE",
              attribution_id_v2:
                "CometGroupDiscussionRoot.react,comet.group,via_cold_start,1733130150010,318182,2361831622,,",
              group_id: groupID,
              readd_policy: "ALLOW_READD",
              actor_id: userToken.userId,
              client_mutation_id: "1",
            },
            ordering: ["viewer_added"],
            scale: 1,
          };
          const responseData = await this.makeRequestToFacebook(
            userToken,
            docID,
            query
          );
          if (!responseData?.data?.group_leave?.group?.id) {
            throw new Error(`❌ Error when leaving group with ID ${groupID}.`);
          }
        })
      );
      console.log(`🔥 Left ${to}/${allJoinedGroups.length} joined groups...`);
    }
    console.log("✅ Left all joined groups successfully");
  };

  unfollowAllPagesAndUsers = async (batchSize: number) => {
    const allFollowing = await this.getAllFollowing();
    const userToken = await this.getCurrentUserToken();
    console.log("\n🚀 Start unfollowing all pages and users...");
    for (let i = 0; i < allFollowing.length; i += batchSize) {
      const from = i;
      const to = Math.min(i + batchSize, allFollowing.length);
      const followingIDs = allFollowing
        .slice(from, to)
        .map((following) => following.id);

      await Promise.all(
        followingIDs.map(async (followingID) => {
          const docID = "8428368873907381";
          const query = {
            input: {
              subscribe_location: "PROFILE",
              unsubscribee_id: followingID,
              actor_id: userToken.userId,
            },
            scale: 1,
          };
          const responseData = await this.makeRequestToFacebook(
            userToken,
            docID,
            query
          );

          if (!responseData?.data?.actor_unsubscribe?.unsubscribee?.id) {
            throw new Error(
              `❌ Error when unfollowing page/user with ID ${followingID}.`
            );
          }
        })
      );
      console.log(`🔥 Unfollowed ${to}/${allFollowing.length} pages/users...`);
    }
    console.log("✅ Unfollowed all pages and users successfully");
  };

  cancelAllSentFriendRequests = async (batchSize: number) => {
    const allSentFriendRequests = await this.getAllSentFriendRequests();
    const userToken = await this.getCurrentUserToken();
    console.log("\n🚀 Start canceling all sent friend requests...");
    for (let i = 0; i < allSentFriendRequests.length; i += batchSize) {
      const from = i;
      const to = Math.min(i + batchSize, allSentFriendRequests.length);
      const requestIDs = allSentFriendRequests
        .slice(from, to)
        .map((request) => request.id);

      await Promise.all(
        requestIDs.map(async (requestID) => {
          const docID = "5247084515315799";
          const query = {
            input: {
              attribution_id_v2:
                "FriendingCometFriendRequestsRoot.react,comet.friending.friendrequests",
              cancelled_friend_requestee_id: requestID,
              friending_channel: "MANAGE_OUTGOING_REQUESTS",
              actor_id: userToken.userId,
              client_mutation_id: "6",
            },
            scale: 1,
          };
          const responseData = await this.makeRequestToFacebook(
            userToken,
            docID,
            query
          );

          if (
            !responseData?.data?.friend_request_cancel
              ?.cancelled_friend_requestee?.id
          ) {
            throw new Error(
              `❌ Error when canceling friend request with ID ${requestID}.`
            );
          }
        })
      );
      console.log(
        `🔥 Canceled ${to}/${allSentFriendRequests.length} sent friend requests...`
      );
    }
    console.log("✅ Canceled all sent friend requests successfully");
  };

  deleteProfilePosts = async (limit: number, batchSize: number) => {
    if (limit !== Infinity && limit % 3 !== 0) {
      throw new Error("❌ Limit must be a multiple of 3");
    }
    const userToken = await this.getCurrentUserToken();
    const postsId = await this.getProfilePostsId(userToken, "", 0, limit);
    console.log(`\n🚀 Start deleting posts. Maximum: ${limit}`);
    for (let i = 0; i < postsId.length; i += batchSize) {
      const from = i;
      const to = Math.min(i + batchSize, postsId.length);
      const slicePostsId = postsId.slice(from, to);
      await Promise.all(
        slicePostsId.map(async (postId) => {
          const docID = "27474543675493933";
          const query = {
            input: {
              story_id: btoa(`S:_I${userToken.userId}:${postId}:${postId}`),
              story_location: "PERMALINK",
              actor_id: userToken.userId,
              client_mutation_id: "2",
            },
            scale: 1,
          };
          const responseData = await this.makeRequestToFacebook(
            userToken,
            docID,
            query
          );
          if (!responseData?.data?.story_delete?.deleted_story_id) {
            throw new Error(`❌ Error when deleting post with ID ${postId}`);
          }
        })
      );
      console.log(`🔥 Deleted ${to}/${postsId.length} posts...`);
    }
    console.log("✅ Delete posts successfully.");
  };

  changePostsPrivacy = async (
    privacy: "SELF" | "EVERYONE" | "FRIENDS",
    limit: number,
    batchSize: number
  ) => {
    if (limit !== Infinity && limit % 3 !== 0) {
      throw new Error("❌ Limit must be a multiple of 3");
    }
    const userToken = await this.getCurrentUserToken();
    const cursor = CacheCursor.getCacheCursor(userToken.userId, "POSTS_ID");
    const startCursor = cursor?.nextCursor || "";
    const totalFetchedPosts = cursor?.totalFetchedItems || 0;
    const postsId = await this.getProfilePostsId(
      userToken,
      startCursor,
      totalFetchedPosts,
      limit
    );
    console.log(
      `\n🚀 Start changing posts privacy to ${privacy}. Maximum: ${limit}`
    );
    for (let i = 0; i < postsId.length; i += batchSize) {
      const from = i;
      const to = Math.min(i + batchSize, postsId.length);
      const slicePostsId = postsId.slice(from, to);
      await Promise.all(
        slicePostsId.map(async (postId) => {
          const docID = "8661755633904824";
          const query = {
            input: {
              privacy_row_input: {
                allow: [],
                base_state: privacy,
                deny: [],
                tag_expansion_state: "UNSPECIFIED",
              },
              privacy_write_id: btoa(`privacy_scope_renderer:{"id":${postId}}`),
              render_location: "COMET_STORY_MENU",
              actor_id: userToken.userId,
              client_mutation_id: "4",
            },
            scale: 1,
          };
          const responseData = await this.makeRequestToFacebook(
            userToken,
            docID,
            query
          );
          if (
            !responseData?.data?.privacy_selector_save?.privacy_scope
              ?.privacy_scope_renderer?.id
          ) {
            throw new Error(
              `❌ Error when changing privacy of post with ID ${postId}`
            );
          }
        })
      );
      console.log(`🔥 Changed privacy ${to}/${postsId.length} posts...`);
    }
    console.log(`✅ Changed privacy posts to ${privacy} successfully.`);
  };

  deleteReactionById = async (
    userToken: ICurrentUserToken,
    reactionData: IReactionData
  ) => {
    const docID = "6951244711576579";
    const query = {
      input: {
        action: "UNLIKE",
        category_key: "LIKEDPOSTS",
        deletion_request_id: null,
        post_id_str: reactionData.postId,
        story_id: reactionData.storyId,
        story_location: "ACTIVITY_LOG",
        actor_id: userToken.userId,
        client_mutation_id: "1",
      },
    };
    const responseData = await this.makeRequestToFacebook(
      userToken,
      docID,
      query
    );
  };

  deleteCommentById = async (
    userToken: ICurrentUserToken,
    commentData: ICommentData
  ) => {
    const docID = "6951244711576579";
    const query = {
      input: {
        action: "REMOVE_COMMENT",
        category_key: "COMMENTSCLUSTER",
        deletion_request_id: null,
        post_id_str: commentData.postId,
        story_id: commentData.storyId,
        story_location: "ACTIVITY_LOG",
        actor_id: userToken.userId,
        client_mutation_id: "2",
      },
    };
    const responseData = await this.makeRequestToFacebook(
      userToken,
      docID,
      query
    );
  };
}

export default FacebookRequest;
