"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  FacebookCleaner: () => FacebookCleaner_default,
  FacebookStatistics: () => FacebookStatistics_default
});
module.exports = __toCommonJS(main_exports);

// src/modules/FacebookCleaner.ts
var import_dayjs2 = __toESM(require("dayjs"));

// src/modules/FacebookRequest.ts
var import_axios = __toESM(require("axios"));

// src/modules/utils/ObjectUtils.ts
var ObjectUtils = class _ObjectUtils {
  static isObjectRecord = (value) => {
    return typeof value === "object" && value !== null;
  };
  static findByKey = ({
    data,
    key,
    condition
  }) => {
    const visited = /* @__PURE__ */ new WeakSet();
    const recursiveSearch = (node) => {
      if (!_ObjectUtils.isObjectRecord(node)) {
        return null;
      }
      if (visited.has(node)) {
        return null;
      }
      visited.add(node);
      if (Array.isArray(node)) {
        for (const item of node) {
          const found = recursiveSearch(item);
          if (found) {
            return found;
          }
        }
        return null;
      }
      if (key in node) {
        const candidate = node[key];
        if (!condition || condition(candidate, node)) {
          return candidate;
        }
      }
      for (const value of Object.values(node)) {
        const found = recursiveSearch(value);
        if (found) {
          return found;
        }
      }
      return null;
    };
    return recursiveSearch(data);
  };
};
var ObjectUtils_default = ObjectUtils;

// src/modules/FacebookRequest.ts
var FacebookRequest = class {
  axiosInstance;
  requestOptions;
  constructor(cookies, requestOptions) {
    this.axiosInstance = import_axios.default.create({
      baseURL: "https://www.facebook.com/api/graphql",
      headers: {
        cookie: cookies,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    const retryCount = Number.isFinite(requestOptions?.retryCount) ? Math.max(0, Math.floor(requestOptions?.retryCount || 0)) : 5;
    const retryDelayInMs = Number.isFinite(requestOptions?.retryDelayInMs) ? Math.max(0, Math.floor(requestOptions?.retryDelayInMs || 0)) : 1e3;
    this.requestOptions = {
      retryCount,
      retryDelayInMs
    };
    this.bindRetryableMethods();
  }
  delay = async (ms) => {
    if (ms <= 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  };
  executeWithRetry = async ({
    action,
    actionName
  }) => {
    const maxRetries = this.requestOptions.retryCount;
    const delayBetweenRetries = this.requestOptions.retryDelayInMs;
    try {
      for (let attempt = 0; attempt < maxRetries; attempt += 1) {
        try {
          return await action();
        } catch (error) {
          const hasNextAttempt = attempt < maxRetries;
          if (!hasNextAttempt) {
            throw error;
          }
          console.warn(
            `\u26A0\uFE0F ${actionName} failed (attempt ${attempt + 1}/${maxRetries}). Retrying in ${delayBetweenRetries}ms...`
          );
          await this.delay(delayBetweenRetries);
        }
      }
      throw new Error(`\u274C ${actionName} failed after ${maxRetries} attempts.`);
    } finally {
    }
  };
  bindRetryableMethods = () => {
    const retryableMethods = [
      "getProfileCredentials",
      "getProfileTabKey",
      "getFollowedPages",
      "getFriends",
      "getFollowing",
      "getJoinedGroups",
      "getSentFriendRequests",
      "getPostsData",
      "getReactionData",
      "getCommentData",
      "unfriend",
      "unfollowPage",
      "leaveGroup",
      "unfollowUserOrPage",
      "cancelSentFriendRequest",
      "deletePost",
      "changePostPrivacy",
      "deleteReaction",
      "deleteComment"
    ];
    for (const methodName of retryableMethods) {
      const originalMethod = this[methodName];
      if (typeof originalMethod !== "function") continue;
      const boundMethod = originalMethod.bind(this);
      this[methodName] = (async (...args) => {
        return this.executeWithRetry({
          action: () => boundMethod(...args),
          actionName: methodName
        });
      });
    }
  };
  getProfileCredentials = async () => {
    try {
      const { data } = await this.axiosInstance.get(
        "https://www.facebook.com/"
      );
      const userId = data.match(/"userId":(\d+)/)[1];
      const fbDtsg = data.match(/"DTSGInitialData".*?"token":"(.*?)"/)[1];
      return { userId, fbDtsg };
    } catch (error) {
      throw new Error(
        "\u274C Error when getting your Facebook token: Invalid cookie"
      );
    }
  };
  getProfileTabKey = async (profileCredentials) => {
    try {
      const docID = "26299170229717540";
      const query = {
        scale: 1,
        selectedID: profileCredentials.userId,
        selectedSpaceType: "profile",
        shouldUseFXIMProfilePicEditor: false,
        userID: profileCredentials.userId
      };
      const headers = {
        "x-fb-friendly-name": "ProfileCometHeaderQuery"
      };
      const responseTextData = await this.makeRequestToFacebook({
        docID,
        query,
        profileCredentials,
        headers
      });
      if (typeof responseTextData !== "string") {
        throw new Error();
      }
      const originalData = JSON.parse(
        responseTextData.split("\n")?.[0] ?? "null"
      );
      const findTabIdByKey = (key) => {
        return ObjectUtils_default.findByKey({
          data: originalData,
          key: "id",
          condition: (candidate, container) => {
            return typeof candidate === "string" && container.tab_key === key;
          }
        }) || "";
      };
      const friendsAllTabKeyId = findTabIdByKey("friends_all");
      const followingTabKeyId = findTabIdByKey("following");
      return { friendsAllTabKeyId, followingTabKeyId };
    } catch (error) {
      throw new Error(
        "\u274C Error when getting profile tab key: " + (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };
  makeRequestToFacebook = async ({
    docID,
    query,
    profileCredentials,
    headers
  }) => {
    const formData = new FormData();
    formData.set("__a", "1");
    formData.set("__comet_req", "15");
    formData.set("fb_dtsg", profileCredentials.fbDtsg);
    formData.set("av", profileCredentials.userId);
    formData.set("doc_id", docID);
    formData.set("variables", JSON.stringify(query));
    const { data } = await this.axiosInstance.post("/", formData, {
      headers
    });
    return data;
  };
  getFollowedPages = async ({
    cursor,
    profileCredentials
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const query = {
      ranking_model: "INTEGRITY_SIGNALS",
      scale: 1,
      id: profileCredentials?.userId || credentials.userId,
      __relay_internal__pv__StoriesRingrelayprovider: false,
      count: 20,
      ...cursor && { cursor }
    };
    const docID = "29841836082128490";
    const headers = {
      "x-fb-friendly-name": "PagesCometAllLikedPagesSectionPaginationQuery"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    const originalLikedPagesList = responseData?.data?.node?.sorted_liked_and_followed_pages?.edges;
    const pageInfor = responseData?.data?.node?.sorted_liked_and_followed_pages?.page_info;
    if (!originalLikedPagesList || !pageInfor) {
      throw new Error(
        "\u274C Error when getting liked pages: Response data is missing expected fields."
      );
    }
    const likedPages = originalLikedPagesList.map(
      ({ node }) => ({
        id: node.id,
        name: node.name,
        url: node.url
      })
    );
    const hasNextPage = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: likedPages,
      pagination: {
        hasMore: hasNextPage,
        nextCursor
      }
    };
  };
  getFriends = async ({
    cursor,
    profileCredentials,
    profileTabKey
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const tabKey = profileTabKey || await this.getProfileTabKey(credentials);
    const query = {
      count: 8,
      scale: 1,
      search: null,
      id: tabKey.friendsAllTabKeyId,
      __relay_internal__pv__FBProfile_enable_perf_improv_gkrelayprovider: true,
      ...cursor && { cursor }
    };
    const docID = "27075075378761750";
    const headers = {
      "x-fb-friendly-name": "ProfileCometAppCollectionSelfFriendsListRendererPaginationQuery"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    const originalFriendsList = responseData?.data?.node?.pageItems?.edges;
    const pageInfor = responseData?.data?.node?.pageItems?.page_info;
    if (!originalFriendsList || !pageInfor) {
      throw new Error(
        "\u274C Error when getting friends: Response data is missing expected fields."
      );
    }
    const friends = originalFriendsList.map(({ node }) => ({
      id: node.actions_renderer.action.profile_owner.id,
      name: node.actions_renderer.action.profile_owner.name,
      url: node.url
    }));
    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: friends,
      pagination: {
        hasMore,
        nextCursor
      }
    };
  };
  getFollowing = async ({
    cursor,
    profileCredentials,
    profileTabKey
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const tabKey = profileTabKey || await this.getProfileTabKey(credentials);
    const query = {
      id: tabKey.followingTabKeyId,
      count: 8,
      scale: 1,
      search: null,
      __relay_internal__pv__FBProfile_enable_perf_improv_gkrelayprovider: true,
      ...cursor && { cursor }
    };
    const docID = "26138331632454030";
    const headers = {
      "x-fb-friendly-name": "ProfileCometAppCollectionListRendererPaginationQuery"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    const originalFollowingList = responseData?.data?.node?.pageItems?.edges;
    const pageInfor = responseData?.data?.node?.pageItems?.page_info;
    if (!originalFollowingList || !pageInfor) {
      throw new Error(
        "\u274C Error when getting following: Response data is missing expected fields."
      );
    }
    const following = originalFollowingList.map(
      ({ node }) => ({
        id: node.node.id,
        name: node.title.text,
        url: node.node.url
      })
    );
    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: following,
      pagination: {
        hasMore,
        nextCursor
      }
    };
  };
  getJoinedGroups = async ({
    cursor,
    profileCredentials
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const query = {
      ordering: ["integrity_signals"],
      scale: 1,
      count: 20,
      ...cursor && { cursor }
    };
    const docID = "9974006939348139";
    const headers = {
      "x-fb-friendly-name": "GroupsCometAllJoinedGroupsSectionPaginationQuery"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    const originalJoinedGroupsList = responseData?.data?.viewer?.all_joined_groups?.tab_groups_list?.edges;
    const pageInfor = responseData?.data?.viewer?.all_joined_groups?.tab_groups_list?.page_info;
    if (!originalJoinedGroupsList || !pageInfor) {
      throw new Error(
        "\u274C Error when getting joined groups: Response data is missing expected fields."
      );
    }
    const joinedGroups = originalJoinedGroupsList.map(
      ({ node }) => ({
        id: node.id,
        name: node.name,
        url: node.url
      })
    );
    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: joinedGroups,
      pagination: {
        hasMore,
        nextCursor
      }
    };
  };
  getSentFriendRequests = async ({
    cursor,
    profileCredentials
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const query = {
      scale: 1,
      count: 10,
      ...cursor && { cursor }
    };
    const docID = "9776114965832879";
    const headers = {
      "x-fb-friendly-name": "FriendingCometOutgoingRequestsDialogPaginationQuery"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    const originalSentFriendRequests = responseData?.data?.viewer?.outgoing_friend_requests_connection?.edges;
    const pageInfor = responseData?.data?.viewer?.outgoing_friend_requests_connection?.page_info;
    if (!originalSentFriendRequests || !pageInfor) {
      throw new Error(
        "\u274C Error when getting sent friend requests: Response data is missing expected fields."
      );
    }
    const sentFriendRequests = originalSentFriendRequests.map(({ node }) => ({
      id: node.id,
      name: node.name,
      url: node.url
    }));
    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: sentFriendRequests,
      pagination: {
        hasMore,
        nextCursor
      }
    };
  };
  getPostsData = async ({
    cursor,
    profileCredentials,
    month,
    year
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const query = {
      activity_history: false,
      audience: null,
      ayi_taxonomy: true,
      category: "MANAGEPOSTSPHOTOSANDVIDEOS",
      category_key: "MANAGEPOSTSPHOTOSANDVIDEOS",
      count: 25,
      cursor: cursor || null,
      entry_point: null,
      media_content_filters: [],
      month: month || null,
      person_id: null,
      privacy: "NONE",
      scale: 1,
      timeline_visibility: "ALL",
      year: year || null
    };
    const docID = "26193682983631967";
    const headers = {
      "x-fb-friendly-name": "CometActivityLogMainContentRootQuery"
    };
    let responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    if (typeof responseData !== "object") {
      responseData = JSON.parse(responseData.split("\n")[0]);
    }
    const originalPostsData = responseData?.data?.viewer?.activity_log_actor?.activity_log_stories?.edges;
    const pageInfor = responseData?.data?.viewer?.activity_log_actor?.activity_log_stories?.page_info;
    if (!originalPostsData || !pageInfor) {
      throw new Error(`Failed to extract posts data for ${month}/${year}`);
    }
    const postsData = originalPostsData.map((post) => ({
      storyId: post.node.id,
      postId: post.node.post_id
    }));
    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: postsData,
      pagination: {
        hasMore,
        nextCursor
      }
    };
  };
  getReactionData = async ({
    cursor,
    profileCredentials,
    month,
    year
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const query = {
      activity_history: false,
      audience: null,
      ayi_taxonomy: true,
      category: "LIKEDPOSTS",
      category_key: "LIKEDPOSTS",
      count: 25,
      cursor: cursor || null,
      entry_point: null,
      media_content_filters: [],
      month: month || null,
      person_id: null,
      privacy: "NONE",
      scale: 1,
      timeline_visibility: "ALL",
      year: year || null
    };
    const docID = "26193682983631967";
    const headers = {
      "x-fb-friendly-name": "CometActivityLogMainContentRootQuery"
    };
    let responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    if (typeof responseData !== "object") {
      responseData = JSON.parse(responseData.split("\n")[0]);
    }
    const originalReactionsData = responseData?.data?.viewer?.activity_log_actor?.activity_log_stories?.edges;
    const pageInfor = responseData?.data?.viewer?.activity_log_actor?.activity_log_stories?.page_info;
    if (!originalReactionsData || !pageInfor) {
      throw new Error(`Failed to extract reaction data for ${month}/${year}`);
    }
    const reactionsData = originalReactionsData.map((post) => {
      const postNode = post.node;
      if (!postNode.id && !postNode.post_id) {
        return void 0;
      }
      return {
        storyId: postNode.id,
        postId: postNode.post_id
      };
    }).filter((reaction) => !!reaction);
    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: reactionsData,
      pagination: {
        hasMore,
        nextCursor
      }
    };
  };
  getCommentData = async ({
    cursor,
    profileCredentials,
    month,
    year
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const query = {
      activity_history: false,
      audience: null,
      ayi_taxonomy: true,
      category: "COMMENTSCLUSTER",
      category_key: "COMMENTSCLUSTER",
      count: 25,
      cursor: cursor || null,
      entry_point: null,
      media_content_filters: [],
      month: month || null,
      person_id: null,
      privacy: "NONE",
      scale: 1,
      timeline_visibility: "ALL",
      year: year || null
    };
    const docID = "26193682983631967";
    const headers = {
      "x-fb-friendly-name": "CometActivityLogMainContentRootQuery"
    };
    let responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    if (typeof responseData !== "object") {
      responseData = JSON.parse(responseData.split("\n")[0]);
    }
    const originalCommentsData = responseData?.data?.viewer?.activity_log_actor?.activity_log_stories?.edges;
    const pageInfor = responseData?.data?.viewer?.activity_log_actor?.activity_log_stories?.page_info;
    if (!originalCommentsData || !pageInfor) {
      throw new Error(`Failed to extract comment data for ${month}/${year}`);
    }
    const commentsData = originalCommentsData.map((post) => {
      const postNode = post.node;
      if (!postNode.id && !postNode.post_id) {
        return void 0;
      }
      return {
        storyId: postNode.id,
        postId: postNode.post_id
      };
    }).filter((comment) => !!comment);
    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: commentsData,
      pagination: {
        hasMore,
        nextCursor
      }
    };
  };
  unfriend = async ({
    profileCredentials,
    friendId
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID: "24028849793460009",
      query: {
        input: {
          source: "bd_profile_button",
          unfriended_user_id: friendId,
          actor_id: credentials.userId,
          client_mutation_id: "6"
        },
        scale: 1
      },
      headers: {
        "x-fb-friendly-name": "FriendingCometUnfriendMutation"
      }
    });
    if (!responseData?.data?.friend_remove?.unfriended_person?.id) {
      throw new Error(`\u274C Error when unfriending ${friendId}.`);
    }
  };
  unfollowPage = async ({
    profileCredentials,
    pageId
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const docID = "23977842521823837";
    const query = {
      input: {
        subscribe_location: "PAGE_FAN",
        unsubscribee_id: pageId,
        actor_id: credentials.userId,
        client_mutation_id: "6"
      }
    };
    const headers = {
      "x-fb-friendly-name": "usePageCometUnfollowMutation"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    if (!responseData?.data?.actor_unsubscribe?.unsubscribee?.id) {
      throw new Error(`\u274C Error when unfollowing page with ID ${pageId}.`);
    }
  };
  leaveGroup = async ({
    profileCredentials,
    groupId
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const docID = "24361296076901408";
    const query = {
      groupID: groupId,
      input: {
        action_source: "COMET_GROUP_PAGE",
        attribution_id_v2: "GroupsCometJoinsRoot.react,comet.groups.joins,unexpected,1774971471296,865482,,,;GroupsCometCrossGroupFeedRoot.react,comet.groups.feed,tap_bookmark,1774971466617,45981,2361831622,,",
        group_id: groupId,
        readd_policy: "ALLOW_READD",
        actor_id: credentials.userId,
        client_mutation_id: "9"
      },
      ordering: ["viewer_added"],
      scale: 1
    };
    const headers = {
      "x-fb-friendly-name": "useGroupLeaveMutation"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    if (!responseData?.data?.group_leave?.group?.id) {
      throw new Error(`\u274C Error when leaving group with ID ${groupId}.`);
    }
  };
  unfollowUserOrPage = async ({
    profileCredentials,
    userOrPageId
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const docID = "27282909147964207";
    const query = {
      action_render_location: "WWW_COMET_FRIEND_MENU",
      input: {
        is_tracking_encrypted: false,
        subscribe_location: "PROFILE",
        tracking: null,
        unsubscribee_id: userOrPageId,
        actor_id: credentials.userId,
        client_mutation_id: "10"
      },
      scale: 1
    };
    const headers = {
      "x-fb-friendly-name": "CometUserUnfollowMutation"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    if (!responseData?.data?.actor_unsubscribe?.unsubscribee?.id) {
      throw new Error(
        `\u274C Error when unfollowing user or page with ID ${userOrPageId}.`
      );
    }
  };
  cancelSentFriendRequest = async ({
    profileCredentials,
    userId
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const docID = "24453541284254355";
    const query = {
      input: {
        cancelled_friend_requestee_id: userId,
        click_correlation_id: String(Date.now()),
        click_proof_validation_result: '{"validated":true}',
        friending_channel: "MANAGE_OUTGOING_REQUESTS",
        actor_id: credentials.userId,
        client_mutation_id: "4"
      },
      scale: 1
    };
    const headers = {
      "x-fb-friendly-name": "FriendingCometFriendRequestCancelMutation"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    if (!responseData?.data?.friend_request_cancel?.cancelled_friend_requestee?.id) {
      throw new Error(
        `\u274C Error when canceling sent friend request to user with ID ${userId}.`
      );
    }
  };
  deletePost = async ({
    profileCredentials,
    postData
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const { userId } = credentials;
    const docID = "24411931498505270";
    const query = {
      input: {
        action: "MOVE_TO_TRASH",
        category_key: "MANAGEPOSTSPHOTOSANDVIDEOS",
        deletion_request_id: null,
        post_id_str: postData.postId,
        story_id: postData.storyId,
        story_location: "ACTIVITY_LOG",
        structured_error_handling: true,
        actor_id: userId,
        client_mutation_id: "2"
      }
    };
    const headers = {
      "x-fb-friendly-name": "CometActivityLogItemCurationMutation"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    if (!responseData?.data?.activity_log_story_curation?.success) {
      throw new Error(
        `\u274C Error when deleting post with ID ${postData.postId}.`
      );
    }
  };
  changePostPrivacy = async ({
    profileCredentials,
    postId,
    privacy
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const { userId } = credentials;
    const docID = "26563540629949194";
    const query = {
      input: {
        privacy_mutation_token: null,
        privacy_row_input: {
          allow: [],
          base_state: privacy,
          deny: [],
          tag_expansion_state: "UNSPECIFIED"
        },
        privacy_write_id: btoa(`privacy_scope_renderer:{"id":${postId}}`),
        render_location: "ACTIVITY_LOG",
        actor_id: userId,
        client_mutation_id: "3"
      },
      privacySelectorRenderLocation: "ACTIVITY_LOG",
      scale: 1,
      storyRenderLocation: null,
      tags: null,
      __relay_internal__pv__CometUFIShareActionMigrationrelayprovider: true,
      __relay_internal__pv__CometUFISingleLineUFIrelayprovider: true
    };
    const headers = {
      "x-fb-friendly-name": "CometPrivacySelectorSavePrivacyMutation"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    if (!responseData?.data?.privacy_selector_save?.privacy_scope?.privacy_scope_renderer?.id) {
      throw new Error(
        `\u274C Error when changing privacy of post with ID ${postId}.`
      );
    }
  };
  deleteReaction = async ({
    profileCredentials,
    reactionData
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const docID = "24411931498505270";
    const query = {
      input: {
        action: "UNLIKE",
        category_key: "LIKEDPOSTS",
        deletion_request_id: null,
        post_id_str: reactionData.postId || null,
        story_id: reactionData.storyId,
        story_location: "ACTIVITY_LOG",
        structured_error_handling: true,
        actor_id: credentials.userId,
        client_mutation_id: "8"
      }
    };
    const headers = {
      "x-fb-friendly-name": "CometActivityLogItemCurationMutation"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    if (!responseData?.data?.activity_log_story_curation?.success) {
      throw new Error(
        `\u274C Error when deleting reaction with story ID ${reactionData.storyId} and post ID ${reactionData.postId}.`
      );
    }
  };
  deleteComment = async ({
    profileCredentials,
    commentData
  }) => {
    const credentials = profileCredentials || await this.getProfileCredentials();
    const docID = "24411931498505270";
    const query = {
      input: {
        action: "REMOVE_COMMENT",
        category_key: "COMMENTSCLUSTER",
        deletion_request_id: null,
        post_id_str: commentData.postId || null,
        story_id: commentData.storyId,
        story_location: "ACTIVITY_LOG",
        structured_error_handling: true,
        actor_id: credentials.userId,
        client_mutation_id: "9"
      }
    };
    const headers = {
      "x-fb-friendly-name": "CometActivityLogItemCurationMutation"
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers
    });
    if (!responseData?.data?.activity_log_story_curation?.success) {
      throw new Error(
        `\u274C Error when deleting comment with story ID ${commentData.storyId} and post ID ${commentData.postId}.`
      );
    }
  };
};
var FacebookRequest_default = FacebookRequest;

// src/modules/utils/DateUtils.ts
var import_dayjs = __toESM(require("dayjs"));
var import_customParseFormat = __toESM(require("dayjs/plugin/customParseFormat"));
import_dayjs.default.extend(import_customParseFormat.default);
var DateUtils = class {
  static isValidDateInput(input) {
    return /^\d{2}\/\d{4}$/.test(input) && (0, import_dayjs.default)(input, "MM/YYYY", true).isValid();
  }
  static isValidTwoDate(from, to) {
    if (!this.isValidDateInput(from) || !this.isValidDateInput(to)) {
      return false;
    }
    let startDate = (0, import_dayjs.default)(from, "MM/YYYY");
    const endDate = (0, import_dayjs.default)(to, "MM/YYYY");
    if (startDate.isAfter(endDate)) {
      return false;
    }
    return true;
  }
  static stringFormatToDate(input) {
    return (0, import_dayjs.default)(input, "MM/YYYY");
  }
};
var DateUtils_default = DateUtils;

// src/modules/FacebookCleaner.ts
var import_isSameOrBefore = __toESM(require("dayjs/plugin/isSameOrBefore"));
import_dayjs2.default.extend(import_isSameOrBefore.default);
var FacebookCleaner = class {
  facebookRequest;
  constructor(cookies, requestOptions) {
    this.facebookRequest = new FacebookRequest_default(cookies, requestOptions);
  }
  normalizeCleanerOptions = (options, actionName) => {
    const concurrencySize = options?.concurrencySize ?? 5;
    const limit = options?.limit ?? Number.POSITIVE_INFINITY;
    const delayInMs = options?.delayInMs ?? 1e3;
    if (!Number.isInteger(concurrencySize) || concurrencySize <= 0) {
      throw new Error(
        `\u274C Invalid concurrencySize in ${actionName}: concurrencySize must be a positive integer.`
      );
    }
    if (!Number.isFinite(limit) && limit !== Number.POSITIVE_INFINITY) {
      throw new Error(
        `\u274C Invalid limit in ${actionName}: limit must be a finite number or Infinity.`
      );
    }
    if (limit < 0) {
      throw new Error(
        `\u274C Invalid limit in ${actionName}: limit must be greater than or equal to 0.`
      );
    }
    if (!Number.isFinite(delayInMs) || delayInMs < 0) {
      throw new Error(
        `\u274C Invalid delayInMs in ${actionName}: delayInMs must be greater than or equal to 0.`
      );
    }
    return {
      concurrencySize,
      limit,
      delayInMs
    };
  };
  delay = async (ms) => {
    if (ms <= 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  };
  fetchAllByCursor = async ({
    limit,
    actionName,
    fetchPage
  }) => {
    const allItems = [];
    let cursor = "";
    let pageNumber = 0;
    const targetText = Number.isFinite(limit) ? String(limit) : "unlimited";
    console.log(
      `\u{1F4E5} ${actionName}: Starting fetching items (target: ${targetText}).`
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
      console.log(`\u{1F4C4} ${actionName}: Fetched ${allItems.length} items...`);
      if (!page.pagination.hasMore || allItems.length >= limit) {
        break;
      }
      cursor = page.pagination.nextCursor;
    }
    console.log(
      `\u2705 ${actionName}: Completed fetching ${allItems.length} items.`
    );
    return allItems;
  };
  runBatchedActions = async ({
    items,
    options,
    actionName,
    runAction
  }) => {
    const totalItems = items.length;
    if (totalItems === 0) {
      console.log(`\u2705 ${actionName}: No item to process.`);
      return;
    }
    console.log(`\u{1F680} ${actionName}: Start processing ${totalItems} item(s).`);
    let processedItems = 0;
    for (let startIndex = 0; startIndex < items.length; startIndex += options.concurrencySize) {
      const currentBatch = items.slice(
        startIndex,
        startIndex + options.concurrencySize
      );
      await Promise.all(currentBatch.map((item) => runAction(item)));
      processedItems += currentBatch.length;
      console.log(
        `\u{1F3C3}\u200D\u2642\uFE0F\u200D\u27A1\uFE0F ${actionName}: Processed ${processedItems}/${totalItems} items...`
      );
      if (processedItems < totalItems) {
        await this.delay(options.delayInMs);
      }
    }
    console.log(
      `\u2705 ${actionName}: Completed ${processedItems}/${totalItems} items.`
    );
  };
  resolveDateWindows = (fromDate, toDate) => {
    const hasFromDate = !!fromDate?.trim();
    const hasToDate = !!toDate?.trim();
    if (hasFromDate !== hasToDate) {
      throw new Error(
        "\u274C Invalid date input. Both fromDate and toDate are required when filtering by date."
      );
    }
    if (!hasFromDate && !hasToDate) {
      return [{ label: "all_time" }];
    }
    const fromDateValue = fromDate;
    const toDateValue = toDate;
    if (!DateUtils_default.isValidTwoDate(fromDateValue, toDateValue)) {
      throw new Error(
        "\u274C Invalid date input. Start date must be before or equal to end date and it must be in MM/YYYY format."
      );
    }
    const windows = [];
    const startDate = DateUtils_default.stringFormatToDate(fromDateValue);
    const endDate = DateUtils_default.stringFormatToDate(toDateValue);
    for (let currentDate = startDate; currentDate.isSameOrBefore(endDate); currentDate = (0, import_dayjs2.default)(currentDate).add(1, "month")) {
      const month = currentDate.month() + 1;
      const year = currentDate.year();
      windows.push({
        month,
        year,
        label: `${month}/${year}`
      });
    }
    return windows;
  };
  getCredentialsAndTabKey = async () => {
    const profileCredentials = await this.facebookRequest.getProfileCredentials();
    const profileTabKey = await this.facebookRequest.getProfileTabKey(profileCredentials);
    return {
      profileCredentials,
      profileTabKey
    };
  };
  removeFriends = async (options = {}) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "removeFriends"
    );
    const { profileCredentials, profileTabKey } = await this.getCredentialsAndTabKey();
    const friends = await this.fetchAllByCursor({
      limit: normalizedOptions.limit,
      actionName: "removeFriends",
      fetchPage: (cursor) => this.facebookRequest.getFriends({
        cursor,
        profileCredentials,
        profileTabKey
      })
    });
    await this.runBatchedActions({
      items: friends,
      options: normalizedOptions,
      actionName: "removeFriends",
      runAction: (friend) => this.facebookRequest.unfriend({
        profileCredentials,
        friendId: friend.id
      })
    });
  };
  unfollowPages = async (options = {}) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "unfollowPages"
    );
    const profileCredentials = await this.facebookRequest.getProfileCredentials();
    const followedPages = await this.fetchAllByCursor({
      limit: normalizedOptions.limit,
      actionName: "unfollowPages",
      fetchPage: (cursor) => this.facebookRequest.getFollowedPages({
        cursor,
        profileCredentials
      })
    });
    await this.runBatchedActions({
      items: followedPages,
      options: normalizedOptions,
      actionName: "unfollowPages",
      runAction: (page) => this.facebookRequest.unfollowPage({
        profileCredentials,
        pageId: page.id
      })
    });
  };
  leaveGroups = async (options = {}) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "leaveGroups"
    );
    const profileCredentials = await this.facebookRequest.getProfileCredentials();
    const joinedGroups = await this.fetchAllByCursor({
      limit: normalizedOptions.limit,
      actionName: "leaveGroups",
      fetchPage: (cursor) => this.facebookRequest.getJoinedGroups({
        cursor,
        profileCredentials
      })
    });
    await this.runBatchedActions({
      items: joinedGroups,
      options: normalizedOptions,
      actionName: "leaveGroups",
      runAction: (group) => this.facebookRequest.leaveGroup({
        profileCredentials,
        groupId: group.id
      })
    });
  };
  unfollowUsersOrPages = async (options = {}) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "unfollowUsersOrPages"
    );
    const { profileCredentials, profileTabKey } = await this.getCredentialsAndTabKey();
    const followings = await this.fetchAllByCursor({
      limit: normalizedOptions.limit,
      actionName: "unfollowUsersOrPages",
      fetchPage: (cursor) => this.facebookRequest.getFollowing({
        cursor,
        profileCredentials,
        profileTabKey
      })
    });
    await this.runBatchedActions({
      items: followings,
      options: normalizedOptions,
      actionName: "unfollowUsersOrPages",
      runAction: (following) => this.facebookRequest.unfollowUserOrPage({
        profileCredentials,
        userOrPageId: following.id
      })
    });
  };
  cancelSentFriendRequests = async (options = {}) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "cancelSentFriendRequests"
    );
    const profileCredentials = await this.facebookRequest.getProfileCredentials();
    const sentFriendRequests = await this.fetchAllByCursor({
      limit: normalizedOptions.limit,
      actionName: "cancelSentFriendRequests",
      fetchPage: (cursor) => this.facebookRequest.getSentFriendRequests({
        cursor,
        profileCredentials
      })
    });
    await this.runBatchedActions({
      items: sentFriendRequests,
      options: normalizedOptions,
      actionName: "cancelSentFriendRequests",
      runAction: (request) => this.facebookRequest.cancelSentFriendRequest({
        profileCredentials,
        userId: request.id
      })
    });
  };
  deletePosts = async ({
    fromDate,
    toDate,
    ...options
  }) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "deletePosts"
    );
    const profileCredentials = await this.facebookRequest.getProfileCredentials();
    const dateWindows = this.resolveDateWindows(fromDate, toDate);
    let remainingLimit = normalizedOptions.limit;
    let totalDeleted = 0;
    for (const dateWindow of dateWindows) {
      if (remainingLimit <= 0) {
        break;
      }
      const postsData = await this.fetchAllByCursor({
        limit: remainingLimit,
        actionName: `deletePosts (${dateWindow.label})`,
        fetchPage: (cursor) => this.facebookRequest.getPostsData({
          cursor,
          profileCredentials,
          month: dateWindow.month,
          year: dateWindow.year
        })
      });
      await this.runBatchedActions({
        items: postsData,
        options: {
          ...normalizedOptions,
          limit: remainingLimit
        },
        actionName: `deletePosts (${dateWindow.label})`,
        runAction: (postData) => this.facebookRequest.deletePost({
          profileCredentials,
          postData
        })
      });
      totalDeleted += postsData.length;
      if (Number.isFinite(remainingLimit)) {
        remainingLimit -= postsData.length;
      }
    }
    if (Number.isFinite(normalizedOptions.limit)) {
      console.log(
        `\u2705 DeletePosts overall: ${totalDeleted}/${normalizedOptions.limit}.`
      );
    } else {
      console.log(`\u2705 DeletePosts overall: ${totalDeleted} item(s).`);
    }
  };
  changePostsPrivacy = async ({
    privacy,
    ...options
  }) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "changePostsPrivacy"
    );
    const profileCredentials = await this.facebookRequest.getProfileCredentials();
    const profilePostIds = await this.fetchAllByCursor({
      limit: normalizedOptions.limit,
      actionName: "changePostsPrivacy",
      fetchPage: (cursor) => this.facebookRequest.getPostsData({
        cursor,
        profileCredentials
      })
    });
    await this.runBatchedActions({
      items: profilePostIds,
      options: normalizedOptions,
      actionName: "changePostsPrivacy",
      runAction: (postData) => this.facebookRequest.changePostPrivacy({
        profileCredentials,
        postId: postData.postId,
        privacy
      })
    });
  };
  deleteReactions = async ({
    fromDate,
    toDate,
    ...options
  }) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "deleteReactions"
    );
    const profileCredentials = await this.facebookRequest.getProfileCredentials();
    const dateWindows = this.resolveDateWindows(fromDate, toDate);
    let remainingLimit = normalizedOptions.limit;
    let totalDeleted = 0;
    for (const dateWindow of dateWindows) {
      if (remainingLimit <= 0) {
        break;
      }
      const reactionsData = await this.fetchAllByCursor({
        limit: remainingLimit,
        actionName: `deleteReactions (${dateWindow.label})`,
        fetchPage: (cursor) => this.facebookRequest.getReactionData({
          cursor,
          profileCredentials,
          month: dateWindow.month,
          year: dateWindow.year
        })
      });
      await this.runBatchedActions({
        items: reactionsData,
        options: {
          ...normalizedOptions,
          limit: remainingLimit
        },
        actionName: `deleteReactions (${dateWindow.label})`,
        runAction: (reactionData) => this.facebookRequest.deleteReaction({
          profileCredentials,
          reactionData
        })
      });
      totalDeleted += reactionsData.length;
      if (Number.isFinite(remainingLimit)) {
        remainingLimit -= reactionsData.length;
      }
    }
    if (Number.isFinite(normalizedOptions.limit)) {
      console.log(
        `\u2705 DeleteReactions overall: ${totalDeleted}/${normalizedOptions.limit}.`
      );
    } else {
      console.log(`\u2705 DeleteReactions overall: ${totalDeleted} item(s).`);
    }
  };
  deleteComments = async ({
    fromDate,
    toDate,
    ...options
  }) => {
    const normalizedOptions = this.normalizeCleanerOptions(
      options,
      "deleteComments"
    );
    const profileCredentials = await this.facebookRequest.getProfileCredentials();
    const dateWindows = this.resolveDateWindows(fromDate, toDate);
    let remainingLimit = normalizedOptions.limit;
    let totalDeleted = 0;
    for (const dateWindow of dateWindows) {
      if (remainingLimit <= 0) {
        break;
      }
      const commentsData = await this.fetchAllByCursor({
        limit: remainingLimit,
        actionName: `deleteComments (${dateWindow.label})`,
        fetchPage: (cursor) => this.facebookRequest.getCommentData({
          cursor,
          profileCredentials,
          month: dateWindow.month,
          year: dateWindow.year
        })
      });
      await this.runBatchedActions({
        items: commentsData,
        options: {
          ...normalizedOptions,
          limit: remainingLimit
        },
        actionName: `deleteComments (${dateWindow.label})`,
        runAction: (commentData) => this.facebookRequest.deleteComment({
          profileCredentials,
          commentData
        })
      });
      totalDeleted += commentsData.length;
      if (Number.isFinite(remainingLimit)) {
        remainingLimit -= commentsData.length;
      }
    }
    if (Number.isFinite(normalizedOptions.limit)) {
      console.log(
        `\u2705 DeleteComments overall: ${totalDeleted}/${normalizedOptions.limit}.`
      );
    } else {
      console.log(`\u2705 DeleteComments overall: ${totalDeleted} item(s).`);
    }
  };
};
var FacebookCleaner_default = FacebookCleaner;

// src/modules/FacebookStatistics.ts
var import_path2 = __toESM(require("path"));

// src/modules/utils/FileUtils.ts
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var import_fast_csv = require("fast-csv");
var FileUtils = class {
  static writeToFile = (absolutePath, content) => {
    const dir = import_path.default.dirname(absolutePath);
    if (!import_fs.default.existsSync(dir)) {
      import_fs.default.mkdirSync(dir, { recursive: true });
    }
    import_fs.default.writeFileSync(absolutePath, content);
  };
  static readObjectFromJsonFile = (absolutePath) => {
    if (!import_fs.default.existsSync(absolutePath)) {
      return null;
    }
    return JSON.parse(import_fs.default.readFileSync(absolutePath, "utf-8"));
  };
  static readCSV = (filePath) => new Promise((resolve, reject) => {
    const allData = [];
    import_fs.default.createReadStream(filePath).pipe((0, import_fast_csv.parse)({ headers: true })).on("data", (row) => {
      allData.push(row);
    }).on("end", () => {
      resolve(allData);
    }).on("error", (error) => {
      reject(error);
    });
  });
  static writeCSV = async (filePath, data, includeHeader = true) => {
    if (!import_fs.default.existsSync(filePath)) {
      const dir = import_path.default.dirname(filePath);
      if (!import_fs.default.existsSync(dir)) {
        import_fs.default.mkdirSync(dir, { recursive: true });
      }
    }
    const writeStream = import_fs.default.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
      (0, import_fast_csv.write)(data, { headers: includeHeader }).pipe(writeStream).on("finish", resolve).on("error", reject);
    });
  };
};
var FileUtils_default = FileUtils;

// src/modules/FacebookStatistics.ts
var FacebookStatistics = class {
  facebookRequest;
  constructor(cookies, requestOptions) {
    this.facebookRequest = new FacebookRequest_default(cookies, requestOptions);
  }
  normalizeStatisticOptions = (options, statisticName) => {
    const writeToCSV = options?.writeToCSV ?? false;
    const savedFilePath = options?.savedFilePath?.trim();
    const limit = options?.limit ?? Number.POSITIVE_INFINITY;
    if (!Number.isFinite(limit) && limit !== Number.POSITIVE_INFINITY) {
      throw new Error(
        `\u274C Invalid limit in ${statisticName}: limit must be a number`
      );
    }
    if (limit < 0) {
      throw new Error(
        `\u274C Invalid limit in ${statisticName}: limit must be greater than or equal to 0`
      );
    }
    if (writeToCSV && !savedFilePath) {
      throw new Error(
        `\u274C Invalid options in ${statisticName}: savedFilePath is required when writeToCSV is true`
      );
    }
    if (savedFilePath && !this.isValidSavedFilePath(savedFilePath)) {
      throw new Error(
        `\u274C Invalid savedFilePath in ${statisticName}: ${savedFilePath}`
      );
    }
    return {
      writeToCSV,
      savedFilePath,
      limit
    };
  };
  isValidSavedFilePath = (savedFilePath) => {
    const normalizedPath = import_path2.default.normalize(savedFilePath);
    const strippedDrivePrefix = normalizedPath.replace(/^[a-zA-Z]:/, "");
    const hasInvalidChars = /[<>:"|?*]/.test(strippedDrivePrefix);
    const fileName = import_path2.default.basename(normalizedPath);
    return !hasInvalidChars && fileName.length > 0 && fileName !== "." && fileName !== "..";
  };
  fetchAllByCursor = async ({
    options,
    statisticName,
    fetchPage,
    needProfileTabKey = false
  }) => {
    const normalizedOptions = this.normalizeStatisticOptions(
      options,
      statisticName
    );
    const profileCredentials = await this.facebookRequest.getProfileCredentials();
    const profileTabKey = needProfileTabKey ? await this.facebookRequest.getProfileTabKey(profileCredentials) : void 0;
    const allItems = [];
    let cursor = "";
    while (true) {
      const response = await fetchPage({
        cursor,
        profileCredentials,
        profileTabKey
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
        `\u{1F680} Fetched ${allItems.length} items from ${statisticName}...`
      );
      if (allItems.length >= normalizedOptions.limit || !response.pagination.hasMore) {
        break;
      }
      cursor = response.pagination.nextCursor;
    }
    console.log(
      `\u2705 Fetched total ${allItems.length} items from ${statisticName} successfully.`
    );
    if (normalizedOptions.writeToCSV && normalizedOptions.savedFilePath) {
      await FileUtils_default.writeCSV(normalizedOptions.savedFilePath, allItems);
    }
    return allItems;
  };
  getFollowedPages = async (options) => {
    return this.fetchAllByCursor({
      options,
      statisticName: "getFollowedPages",
      fetchPage: ({ cursor, profileCredentials }) => this.facebookRequest.getFollowedPages({
        cursor,
        profileCredentials
      })
    });
  };
  getFriends = async (options) => {
    return this.fetchAllByCursor({
      options,
      statisticName: "getFriends",
      needProfileTabKey: true,
      fetchPage: ({ cursor, profileCredentials, profileTabKey }) => this.facebookRequest.getFriends({
        cursor,
        profileCredentials,
        profileTabKey
      })
    });
  };
  getFollowings = async (options) => {
    return this.fetchAllByCursor({
      options,
      statisticName: "getFollowings",
      needProfileTabKey: true,
      fetchPage: ({ cursor, profileCredentials, profileTabKey }) => this.facebookRequest.getFollowing({
        cursor,
        profileCredentials,
        profileTabKey
      })
    });
  };
  getJoinedGroups = async (options) => {
    return this.fetchAllByCursor({
      options,
      statisticName: "getJoinedGroups",
      fetchPage: ({ cursor, profileCredentials }) => this.facebookRequest.getJoinedGroups({
        cursor,
        profileCredentials
      })
    });
  };
  getSentFriendRequests = async (options) => {
    return this.fetchAllByCursor({
      options,
      statisticName: "getSentFriendRequests",
      fetchPage: ({ cursor, profileCredentials }) => this.facebookRequest.getSentFriendRequests({
        cursor,
        profileCredentials
      })
    });
  };
};
var FacebookStatistics_default = FacebookStatistics;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FacebookCleaner,
  FacebookStatistics
});
