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

// src/modules/utils/CacheCursor.ts
var import_path2 = __toESM(require("path"));

// src/modules/utils/FileUtils.ts
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var import_fast_csv = require("fast-csv");
var FileUtils = class {
};
FileUtils.writeToFile = (absolutePath, content) => {
  const dir = import_path.default.dirname(absolutePath);
  if (!import_fs.default.existsSync(dir)) {
    import_fs.default.mkdirSync(dir, { recursive: true });
  }
  import_fs.default.writeFileSync(absolutePath, content);
};
FileUtils.readObjectFromJsonFile = (absolutePath) => {
  if (!import_fs.default.existsSync(absolutePath)) {
    return null;
  }
  return JSON.parse(import_fs.default.readFileSync(absolutePath, "utf-8"));
};
FileUtils.readCSV = (filePath) => new Promise((resolve, reject) => {
  const allData = [];
  import_fs.default.createReadStream(filePath).pipe((0, import_fast_csv.parse)({ headers: true })).on("data", (row) => {
    allData.push(row);
  }).on("end", () => {
    resolve(allData);
  }).on("error", (error) => {
    reject(error);
  });
});
FileUtils.writeCSV = async (filePath, data, includeHeader = true) => {
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
var FileUtils_default = FileUtils;

// src/modules/utils/CacheCursor.ts
var _CacheCursor = class _CacheCursor {
};
_CacheCursor.getSavedCacheCursorPath = (userId) => {
  const baseDir = import_path2.default.resolve("cache_cursor", userId);
  return {
    POSTS_ID_CACHE_CURSOR_PATH: import_path2.default.resolve(baseDir, "posts_id.json")
  };
};
_CacheCursor.writeCacheCursor = (userId, type, cursor) => {
  const { POSTS_ID_CACHE_CURSOR_PATH } = _CacheCursor.getSavedCacheCursorPath(userId);
  const mappedPath = {
    POSTS_ID: POSTS_ID_CACHE_CURSOR_PATH
  };
  FileUtils_default.writeToFile(mappedPath[type], JSON.stringify(cursor, null, 2));
};
_CacheCursor.getCacheCursor = (userId, type) => {
  const { POSTS_ID_CACHE_CURSOR_PATH } = _CacheCursor.getSavedCacheCursorPath(userId);
  const mappedPath = {
    POSTS_ID: POSTS_ID_CACHE_CURSOR_PATH
  };
  return FileUtils_default.readObjectFromJsonFile(mappedPath[type]);
};
var CacheCursor = _CacheCursor;
var CacheCursor_default = CacheCursor;

// src/modules/utils/PathUtils.ts
var import_fs2 = require("fs");
var import_path3 = __toESM(require("path"));
var PathUtils = class {
};
PathUtils.getLocalDownloadDir = () => {
  const LOCAL_DOWNLOAD_DIR = import_path3.default.resolve(
    process.env.USERPROFILE || "",
    "Downloads"
  );
  if (!(0, import_fs2.existsSync)(LOCAL_DOWNLOAD_DIR)) {
    throw new Error("\u274C Cannot find the download directory on your system");
  }
  return LOCAL_DOWNLOAD_DIR;
};
PathUtils.getSavedProfileStatisticsDirPath = (userId) => {
  const LOCAL_DOWNLOAD_DIR = import_path3.default.resolve(
    process.env.USERPROFILE || "",
    "Downloads"
  );
  if (!(0, import_fs2.existsSync)(LOCAL_DOWNLOAD_DIR)) {
    throw new Error("\u274C Cannot find the download directory on your system");
  }
  const BASE_DIR = import_path3.default.resolve(
    LOCAL_DOWNLOAD_DIR,
    "facebook_statistics",
    userId
  );
  return {
    LIKED_PAGES: import_path3.default.resolve(BASE_DIR, "liked_paged.csv"),
    FRIENDS: import_path3.default.resolve(BASE_DIR, "friends.csv"),
    FOLLOWING: import_path3.default.resolve(BASE_DIR, "following.csv"),
    JOINED_GROUPS: import_path3.default.resolve(BASE_DIR, "joined_groups.csv"),
    SENT_FRIEND_REQUESTS: import_path3.default.resolve(BASE_DIR, "sent_friend_requests.csv")
  };
};
var PathUtils_default = PathUtils;

// src/modules/FacebookRequest.ts
var FacebookRequest = class {
  constructor(cookies) {
    this.getCurrentUserToken = async () => {
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
    this.makeRequestToFacebook = async (userToken, docID, query) => {
      const formData = new FormData();
      formData.set("fb_dtsg", userToken.fbDtsg);
      formData.set("av", userToken.userId);
      formData.set("doc_id", docID);
      formData.set("variables", JSON.stringify(query));
      const { data } = await this.axiosInstance.post("/", formData);
      return data;
    };
    this.getAllLikedPages = async (writeToCSV = false) => {
      const userToken = await this.getCurrentUserToken();
      const allLikedPages = [];
      console.log("\u{1F680} Start getting liked pages...");
      const baseQuery = {
        ranking_model: "INTEGRITY_SIGNALS",
        scale: 1,
        id: userToken.userId,
        __relay_internal__pv__StoriesRingrelayprovider: false
      };
      let hasNextPage = false;
      let endCursor = "";
      do {
        const docID = "8407760875943054";
        const query = {
          ...baseQuery,
          ...allLikedPages.length && { count: 20, cursor: endCursor }
        };
        const responseData = await this.makeRequestToFacebook(
          userToken,
          docID,
          query
        );
        const originalLikedPagesList = responseData?.data?.node?.sorted_liked_and_followed_pages?.edges;
        const pageInfor = responseData?.data?.node?.sorted_liked_and_followed_pages?.page_info;
        if (!originalLikedPagesList || !pageInfor) {
          console.log("\u{1F610} There are some errors. Start retrying...");
          continue;
        }
        const likedPages = originalLikedPagesList.map(({ node }) => ({
          id: node.id,
          name: node.name,
          url: node.url
        }));
        allLikedPages.push(...likedPages);
        console.log(`\u{1F525} Got ${allLikedPages.length} liked pages...`);
        hasNextPage = pageInfor.has_next_page;
        endCursor = pageInfor.end_cursor;
      } while (hasNextPage);
      console.log(
        `\u2705 Get all liked pages successfully. Total: ${allLikedPages.length}`
      );
      if (writeToCSV && allLikedPages.length) {
        const { LIKED_PAGES } = PathUtils_default.getSavedProfileStatisticsDirPath(
          userToken.userId
        );
        await FileUtils_default.writeCSV(
          LIKED_PAGES,
          allLikedPages.map((page, index) => ({
            ordinal_number: index + 1,
            ...page
          }))
        );
      }
      return allLikedPages;
    };
    this.getAllFriends = async (writeToCSV = false) => {
      const userToken = await this.getCurrentUserToken();
      const allFriends = [];
      console.log("\u{1F680} Start getting friends...");
      const baseQuery = {
        scale: 1
      };
      let hasNextPage = false;
      let endCursor = "";
      do {
        const docID = "27405320069114034";
        const query = {
          ...baseQuery,
          ...allFriends.length && { count: 30, cursor: endCursor }
        };
        const responseData = await this.makeRequestToFacebook(
          userToken,
          docID,
          query
        );
        const originalFriendsList = responseData?.data?.viewer?.all_friends.edges;
        const pageInfor = responseData?.data?.viewer?.all_friends?.page_info;
        if (!originalFriendsList || !pageInfor) {
          console.log("\u{1F610} There are some errors. Start retrying...");
          continue;
        }
        const friends = originalFriendsList.map(({ node }) => ({
          id: node.id,
          name: node.name,
          url: node.url
        }));
        allFriends.push(...friends);
        console.log(`\u{1F525} Got ${allFriends.length} friends...`);
        hasNextPage = pageInfor.has_next_page;
        endCursor = pageInfor.end_cursor;
      } while (hasNextPage);
      console.log(`\u2705 Get all friends successfully. Total: ${allFriends.length}`);
      if (writeToCSV && allFriends.length) {
        const { FRIENDS } = PathUtils_default.getSavedProfileStatisticsDirPath(
          userToken.userId
        );
        await FileUtils_default.writeCSV(
          FRIENDS,
          allFriends.map((friend, index) => ({
            ordinal_number: index + 1,
            ...friend
          }))
        );
      }
      return allFriends;
    };
    this.getAllFollowing = async (writeToCSV = false) => {
      const userToken = await this.getCurrentUserToken();
      const allFollowings = [];
      console.log("\u{1F680} Start getting following...");
      const baseQuery = {
        scale: 1,
        id: btoa(`app_collection:${userToken.userId}:2356318349:33`)
      };
      let hasNextPage = false;
      let endCursor = "";
      do {
        const docID = "8512257125510319";
        const query = {
          ...baseQuery,
          ...allFollowings.length && { count: 8, cursor: endCursor }
        };
        const responseData = await this.makeRequestToFacebook(
          userToken,
          docID,
          query
        );
        const originalFollowingList = responseData?.data?.node?.pageItems?.edges;
        const pageInfor = responseData?.data?.node?.pageItems?.page_info;
        if (!originalFollowingList || !pageInfor) {
          console.log("\u{1F610} There are some errors. Start retrying...");
          continue;
        }
        const following = originalFollowingList.map(({ node }) => ({
          id: node.node.id,
          name: node.title.text,
          url: node.url
        }));
        allFollowings.push(...following);
        console.log(`\u{1F525} Got ${allFollowings.length} following...`);
        hasNextPage = pageInfor.has_next_page;
        endCursor = pageInfor.end_cursor;
      } while (hasNextPage);
      console.log(
        `\u2705 Get all following successfully. Total: ${allFollowings.length}`
      );
      if (writeToCSV && allFollowings.length) {
        const { FOLLOWING } = PathUtils_default.getSavedProfileStatisticsDirPath(
          userToken.userId
        );
        await FileUtils_default.writeCSV(
          FOLLOWING,
          allFollowings.map((following, index) => ({
            ordinal_number: index + 1,
            ...following
          }))
        );
      }
      return allFollowings;
    };
    this.getAllJoinedGroups = async (writeToCSV = false) => {
      const userToken = await this.getCurrentUserToken();
      const allJoinedGroups = [];
      console.log("\u{1F680} Start getting joined groups...");
      const baseQuery = {
        ordering: ["integrity_signals"],
        scale: 1
      };
      let hasNextPage = false;
      let endCursor = "";
      do {
        const docID = "6009728632468556";
        const query = {
          ...baseQuery,
          ...allJoinedGroups.length && { count: 20, cursor: endCursor }
        };
        const responseData = await this.makeRequestToFacebook(
          userToken,
          docID,
          query
        );
        const originalJoinedGroupsList = responseData?.data?.viewer?.all_joined_groups?.tab_groups_list?.edges;
        const pageInfor = responseData?.data?.viewer?.all_joined_groups?.tab_groups_list?.page_info;
        if (!originalJoinedGroupsList || !pageInfor) {
          console.log("\u{1F610} There are some errors. Start retrying...");
          continue;
        }
        const joinedGroups = originalJoinedGroupsList.map(({ node }) => ({
          id: node.id,
          name: node.name,
          url: node.url
        }));
        allJoinedGroups.push(...joinedGroups);
        console.log(`\u{1F525} Got ${allJoinedGroups.length} joined groups...`);
        hasNextPage = pageInfor.has_next_page;
        endCursor = pageInfor.end_cursor;
      } while (hasNextPage);
      console.log(
        `\u2705 Get all joined groups successfully. Total: ${allJoinedGroups.length}`
      );
      if (writeToCSV && allJoinedGroups.length) {
        const { JOINED_GROUPS } = PathUtils_default.getSavedProfileStatisticsDirPath(
          userToken.userId
        );
        await FileUtils_default.writeCSV(
          JOINED_GROUPS,
          allJoinedGroups.map((group, index) => ({
            ordinal_number: index + 1,
            ...group
          }))
        );
      }
      return allJoinedGroups;
    };
    this.getAllSentFriendRequests = async (writeToCSV = false) => {
      const userToken = await this.getCurrentUserToken();
      const allSentFriendRequests = [];
      console.log("\u{1F680} Start getting sent friend requests...");
      const baseQuery = {
        scale: 1
      };
      let hasNextPage = false;
      let endCursor = "";
      do {
        const docID = "4420916318007844";
        const query = {
          ...baseQuery,
          ...allSentFriendRequests.length && { count: 10, cursor: endCursor }
        };
        const responseData = await this.makeRequestToFacebook(
          userToken,
          docID,
          query
        );
        const originalSentFriendRequests = responseData?.data?.viewer?.outgoing_friend_requests_connection?.edges;
        const pageInfor = responseData?.data?.viewer?.outgoing_friend_requests_connection?.page_info;
        if (!originalSentFriendRequests || !pageInfor) {
          console.log("\u{1F610} There are some errors. Start retrying...");
          continue;
        }
        const sentFriendRequests = originalSentFriendRequests.map(
          ({ node }) => ({
            id: node.id,
            name: node.name,
            url: node.url
          })
        );
        allSentFriendRequests.push(...sentFriendRequests);
        console.log(
          `\u{1F525} Got ${allSentFriendRequests.length} sent friend requests...`
        );
        hasNextPage = pageInfor.has_next_page;
        endCursor = pageInfor.end_cursor;
      } while (hasNextPage);
      console.log(
        `\u2705 Get all sent friend requests successfully. Total: ${allSentFriendRequests.length}`
      );
      if (writeToCSV && allSentFriendRequests.length) {
        const { SENT_FRIEND_REQUESTS } = PathUtils_default.getSavedProfileStatisticsDirPath(userToken.userId);
        await FileUtils_default.writeCSV(
          SENT_FRIEND_REQUESTS,
          allSentFriendRequests.map((request, index) => ({
            ordinal_number: index + 1,
            ...request
          }))
        );
      }
      return allSentFriendRequests;
    };
    this.getProfilePostsId = async (userToken, startCursor, totalFetchedPostsId, limit) => {
      const postsId = [];
      console.log(
        `\u{1F680} Start getting posts id. Fetched ${totalFetchedPostsId}. Maximum: ${limit}`
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
        id: userToken.userId
      };
      const postIdRegex = /"post_id":"(.*?)","cix_screen":/g;
      const pageInforRegex = /"data":\{"page_info":(.*?)\},"extensions"/;
      do {
        const docID = "8687710371346343";
        const query = {
          ...baseQuery,
          cursor: endCursor
        };
        const responseText = await this.makeRequestToFacebook(
          userToken,
          docID,
          query
        );
        const postsIdTemp = [];
        const pageInfoInText = pageInforRegex.exec(responseText)?.[1];
        if (!pageInfoInText) {
          console.log("\u{1F610} There are some errors. Start retrying...");
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
        console.log(`\u{1F525} Got ${postsId.length} posts id...`);
        hasNextPage = pageInfo.has_next_page;
        endCursor = pageInfo.end_cursor;
      } while (hasNextPage && postsId.length < limit);
      const cacheCursorInfor = {
        nextCursor: hasNextPage ? endCursor : "",
        totalFetchedItems: hasNextPage ? totalFetchedPostsId + postsId.length : 0
      };
      CacheCursor_default.writeCacheCursor(
        userToken.userId,
        "POSTS_ID",
        cacheCursorInfor
      );
      hasNextPage ? console.log(
        `\u{1F503} Got ${postsId.length} posts id and still have posts id left`
      ) : console.log(
        `\u2705 Get posts id of current user successfully. Total: ${postsId.length + totalFetchedPostsId}`
      );
      return postsId;
    };
    this.getReactionData = async (userToken, month, year) => {
      const result = [];
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
        id: userToken.userId
      };
      console.log(`
\u{1F680} Start getting reactions in ${month}/${year}.`);
      do {
        const docID = "27684299287850969";
        const query = {
          ...baseQuery,
          cursor: endCursor
        };
        let responseData = await this.makeRequestToFacebook(
          userToken,
          docID,
          query
        );
        if (typeof responseData !== "object") {
          responseData = JSON.parse(responseData.split("\n")[0]);
        }
        const originalReactionsData = responseData?.data?.node?.activity_log_stories?.edges;
        const pageInfor = responseData?.data?.node?.activity_log_stories?.page_info;
        if (!originalReactionsData || !pageInfor) {
          console.log(
            `\u{1F610} There are some errors when getting reactions in ${month}/${year}. Start retrying...`
          );
          continue;
        }
        const reactionsData = originalReactionsData.map((post) => {
          const postNode = post.node;
          if (!postNode.id || !postNode.post_id) {
            return void 0;
          }
          return {
            storyId: postNode.id,
            postId: postNode.post_id
          };
        }).filter((reaction) => !!reaction);
        result.push(...reactionsData);
        console.log(`\u{1F525} Got ${result.length} reactions...`);
        hasNextPage = pageInfor.has_next_page;
        endCursor = pageInfor.end_cursor;
      } while (hasNextPage);
      console.log(
        `\u2705 Got all reactions in ${month}/${year} successfully. Total: ${result.length}`
      );
      return result;
    };
    this.getCommentData = async (userToken, month, year) => {
      const result = [];
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
        id: userToken.userId
      };
      console.log(`
\u{1F680} Start getting comments in ${month}/${year}.`);
      do {
        const docID = "27684299287850969";
        const query = {
          ...baseQuery,
          cursor: endCursor
        };
        let responseData = await this.makeRequestToFacebook(
          userToken,
          docID,
          query
        );
        if (typeof responseData !== "object") {
          responseData = JSON.parse(responseData.split("\n")[0]);
        }
        const originalCommentsData = responseData?.data?.node?.activity_log_stories?.edges;
        const pageInfor = responseData?.data?.node?.activity_log_stories?.page_info;
        if (!originalCommentsData || !pageInfor) {
          console.log(
            `\u{1F610} There are some errors when getting comments in ${month}/${year}. Start retrying...`
          );
          continue;
        }
        const commentsData = originalCommentsData.map((post) => {
          const postNode = post.node;
          if (!postNode.id || !postNode.post_id) {
            return void 0;
          }
          return {
            storyId: postNode.id,
            postId: postNode.post_id
          };
        }).filter((comment) => !!comment);
        result.push(...commentsData);
        console.log(`\u{1F525} Got ${result.length} comments...`);
        hasNextPage = pageInfor.has_next_page;
        endCursor = pageInfor.end_cursor;
      } while (hasNextPage);
      console.log(
        `\u2705 Got all comments in ${month}/${year} successfully. Total: ${result.length}`
      );
      return result;
    };
    this.removeAllFriends = async (batchSize) => {
      const allFriends = await this.getAllFriends();
      const userToken = await this.getCurrentUserToken();
      console.log("\n\u{1F680} Start removing all friends...");
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
                  client_mutation_id: "1"
                },
                scale: 1
              }
            );
            if (!responseData?.data?.friend_remove?.unfriended_person?.id) {
              throw new Error(
                `\u274C Error when removing friend with ID ${friendID}.`
              );
            }
          })
        );
        console.log(`\u{1F525} Removed ${to}/${allFriends.length} friends...`);
      }
      console.log("\u2705 Removed all friends successfully");
    };
    this.removeAllLikedPages = async (batchSize) => {
      const allLikedPages = await this.getAllLikedPages();
      const userToken = await this.getCurrentUserToken();
      console.log("\n\u{1F680} Start removing all liked pages...");
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
                client_mutation_id: "1"
              },
              scale: 1
            };
            const responseData = await this.makeRequestToFacebook(
              userToken,
              docID,
              query
            );
            if (!responseData?.data?.page_unlike.page?.profile_plus_for_delegate_page?.id) {
              throw new Error(
                `\u274C Error when removing liked page with ID ${pageID}.`
              );
            }
          })
        );
        console.log(`\u{1F525} Removed ${to}/${allLikedPages.length} liked pages...`);
      }
      console.log("\u2705 Removed all liked pages successfully");
    };
    this.leaveAllJoinedGroups = async (batchSize) => {
      const allJoinedGroups = await this.getAllJoinedGroups();
      const userToken = await this.getCurrentUserToken();
      console.log("\n\u{1F680} Start leaving all joined groups...");
      for (let i = 0; i < allJoinedGroups.length; i += batchSize) {
        const from = i;
        const to = Math.min(i + batchSize, allJoinedGroups.length);
        const groupIDs = allJoinedGroups.slice(from, to).map((group) => group.id);
        await Promise.all(
          groupIDs.map(async (groupID) => {
            const docID = "7925432007559878";
            const query = {
              groupID,
              input: {
                action_source: "COMET_GROUP_PAGE",
                attribution_id_v2: "CometGroupDiscussionRoot.react,comet.group,via_cold_start,1733130150010,318182,2361831622,,",
                group_id: groupID,
                readd_policy: "ALLOW_READD",
                actor_id: userToken.userId,
                client_mutation_id: "1"
              },
              ordering: ["viewer_added"],
              scale: 1
            };
            const responseData = await this.makeRequestToFacebook(
              userToken,
              docID,
              query
            );
            if (!responseData?.data?.group_leave?.group?.id) {
              throw new Error(`\u274C Error when leaving group with ID ${groupID}.`);
            }
          })
        );
        console.log(`\u{1F525} Left ${to}/${allJoinedGroups.length} joined groups...`);
      }
      console.log("\u2705 Left all joined groups successfully");
    };
    this.unfollowAllPagesAndUsers = async (batchSize) => {
      const allFollowing = await this.getAllFollowing();
      const userToken = await this.getCurrentUserToken();
      console.log("\n\u{1F680} Start unfollowing all pages and users...");
      for (let i = 0; i < allFollowing.length; i += batchSize) {
        const from = i;
        const to = Math.min(i + batchSize, allFollowing.length);
        const followingIDs = allFollowing.slice(from, to).map((following) => following.id);
        await Promise.all(
          followingIDs.map(async (followingID) => {
            const docID = "8428368873907381";
            const query = {
              input: {
                subscribe_location: "PROFILE",
                unsubscribee_id: followingID,
                actor_id: userToken.userId
              },
              scale: 1
            };
            const responseData = await this.makeRequestToFacebook(
              userToken,
              docID,
              query
            );
            if (!responseData?.data?.actor_unsubscribe?.unsubscribee?.id) {
              throw new Error(
                `\u274C Error when unfollowing page/user with ID ${followingID}.`
              );
            }
          })
        );
        console.log(`\u{1F525} Unfollowed ${to}/${allFollowing.length} pages/users...`);
      }
      console.log("\u2705 Unfollowed all pages and users successfully");
    };
    this.cancelAllSentFriendRequests = async (batchSize) => {
      const allSentFriendRequests = await this.getAllSentFriendRequests();
      const userToken = await this.getCurrentUserToken();
      console.log("\n\u{1F680} Start canceling all sent friend requests...");
      for (let i = 0; i < allSentFriendRequests.length; i += batchSize) {
        const from = i;
        const to = Math.min(i + batchSize, allSentFriendRequests.length);
        const requestIDs = allSentFriendRequests.slice(from, to).map((request) => request.id);
        await Promise.all(
          requestIDs.map(async (requestID) => {
            const docID = "5247084515315799";
            const query = {
              input: {
                attribution_id_v2: "FriendingCometFriendRequestsRoot.react,comet.friending.friendrequests",
                cancelled_friend_requestee_id: requestID,
                friending_channel: "MANAGE_OUTGOING_REQUESTS",
                actor_id: userToken.userId,
                client_mutation_id: "6"
              },
              scale: 1
            };
            const responseData = await this.makeRequestToFacebook(
              userToken,
              docID,
              query
            );
            if (!responseData?.data?.friend_request_cancel?.cancelled_friend_requestee?.id) {
              throw new Error(
                `\u274C Error when canceling friend request with ID ${requestID}.`
              );
            }
          })
        );
        console.log(
          `\u{1F525} Canceled ${to}/${allSentFriendRequests.length} sent friend requests...`
        );
      }
      console.log("\u2705 Canceled all sent friend requests successfully");
    };
    this.deleteProfilePosts = async (limit, batchSize) => {
      if (limit !== Infinity && limit % 3 !== 0) {
        throw new Error("\u274C Limit must be a multiple of 3");
      }
      const userToken = await this.getCurrentUserToken();
      const postsId = await this.getProfilePostsId(userToken, "", 0, limit);
      console.log(`
\u{1F680} Start deleting posts. Maximum: ${limit}`);
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
                client_mutation_id: "2"
              },
              scale: 1
            };
            const responseData = await this.makeRequestToFacebook(
              userToken,
              docID,
              query
            );
            if (!responseData?.data?.story_delete?.deleted_story_id) {
              throw new Error(`\u274C Error when deleting post with ID ${postId}`);
            }
          })
        );
        console.log(`\u{1F525} Deleted ${to}/${postsId.length} posts...`);
      }
      console.log("\u2705 Delete posts successfully.");
    };
    this.changePostsPrivacy = async (privacy, limit, batchSize) => {
      if (limit !== Infinity && limit % 3 !== 0) {
        throw new Error("\u274C Limit must be a multiple of 3");
      }
      const userToken = await this.getCurrentUserToken();
      const cursor = CacheCursor_default.getCacheCursor(userToken.userId, "POSTS_ID");
      const startCursor = cursor?.nextCursor || "";
      const totalFetchedPosts = cursor?.totalFetchedItems || 0;
      const postsId = await this.getProfilePostsId(
        userToken,
        startCursor,
        totalFetchedPosts,
        limit
      );
      console.log(
        `
\u{1F680} Start changing posts privacy to ${privacy}. Maximum: ${limit}`
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
                  tag_expansion_state: "UNSPECIFIED"
                },
                privacy_write_id: btoa(`privacy_scope_renderer:{"id":${postId}}`),
                render_location: "COMET_STORY_MENU",
                actor_id: userToken.userId,
                client_mutation_id: "4"
              },
              scale: 1
            };
            const responseData = await this.makeRequestToFacebook(
              userToken,
              docID,
              query
            );
            if (!responseData?.data?.privacy_selector_save?.privacy_scope?.privacy_scope_renderer?.id) {
              throw new Error(
                `\u274C Error when changing privacy of post with ID ${postId}`
              );
            }
          })
        );
        console.log(`\u{1F525} Changed privacy ${to}/${postsId.length} posts...`);
      }
      console.log(`\u2705 Changed privacy posts to ${privacy} successfully.`);
    };
    this.deleteReactionById = async (userToken, reactionData) => {
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
          client_mutation_id: "1"
        }
      };
      const responseData = await this.makeRequestToFacebook(
        userToken,
        docID,
        query
      );
    };
    this.deleteCommentById = async (userToken, commentData) => {
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
          client_mutation_id: "2"
        }
      };
      const responseData = await this.makeRequestToFacebook(
        userToken,
        docID,
        query
      );
    };
    this.axiosInstance = import_axios.default.create({
      baseURL: "https://www.facebook.com/api/graphql",
      headers: { cookie: cookies }
    });
    this.axiosInstance.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response) {
          const responseData = error.response.data;
          throw new Error(
            `\u274C Error when making request to Instagram: ${JSON.stringify(
              responseData,
              null,
              2
            )}`
          );
        }
        throw new Error(`\u274C Unknown error: ${error.message}`);
      }
    );
  }
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
  constructor(cookies) {
    this.removeAllFriends = async (batchSize = 5) => {
      await this.facebookRequest.removeAllFriends(batchSize);
    };
    this.removeAllLikedPages = async (batchSize = 5) => {
      await this.facebookRequest.removeAllLikedPages(batchSize);
    };
    this.leaveAllGroups = async (batchSize = 1) => {
      await this.facebookRequest.leaveAllJoinedGroups(batchSize);
    };
    this.unfollowAllPagesAndUsers = async (batchSize = 1) => {
      await this.facebookRequest.unfollowAllPagesAndUsers(batchSize);
    };
    this.cancelAllSentFriendRequests = async (batchSize = 5) => {
      await this.facebookRequest.cancelAllSentFriendRequests(batchSize);
    };
    this.deletePosts = async (limit = Infinity, batchSize = 5) => {
      await this.facebookRequest.deleteProfilePosts(limit, batchSize);
    };
    this.changePostsPrivacy = async (privacy, limit = Infinity, batchSize = 5) => {
      await this.facebookRequest.changePostsPrivacy(privacy, limit, batchSize);
    };
    this.deleteReactions = async (fromDate, toDate, batchSize = 5) => {
      if (!DateUtils_default.isValidTwoDate(fromDate, toDate)) {
        throw new Error(
          "\u274C Invalid date input. Start date must be before or equal to end date and it must be in MM/YYYY format."
        );
      }
      let startDate = DateUtils_default.stringFormatToDate(fromDate);
      let endDate = DateUtils_default.stringFormatToDate(toDate);
      const userToken = await this.facebookRequest.getCurrentUserToken();
      for (let i = startDate; i.isSameOrBefore(endDate); i = (0, import_dayjs2.default)(i).add(1, "month")) {
        const month = i.month() + 1;
        const year = i.year();
        const reactionsData = await this.facebookRequest.getReactionData(
          userToken,
          month,
          year
        );
        if (reactionsData.length === 0) {
          continue;
        }
        console.log(`\u{1F680} Start deleting reactions in ${month}/${year}.`);
        for (let i2 = 0; i2 < reactionsData.length; i2 += batchSize) {
          const from = i2;
          const to = Math.min(i2 + batchSize, reactionsData.length);
          const sliceReactionsData = reactionsData.slice(from, to);
          await Promise.all(
            sliceReactionsData.map(async (reactionData) => {
              await this.facebookRequest.deleteReactionById(
                userToken,
                reactionData
              );
            })
          );
          console.log(`\u{1F525} Deleted ${to}/${reactionsData.length} reactions...`);
        }
        console.log(`\u2705 Deleted all reactions in ${month}/${year} successfully.`);
      }
    };
    this.deleteComments = async (fromDate, toDate, batchSize = 5) => {
      if (!DateUtils_default.isValidTwoDate(fromDate, toDate)) {
        throw new Error(
          "\u274C Invalid date input. Start date must be before or equal to end date and it must be in MM/YYYY format."
        );
      }
      let startDate = DateUtils_default.stringFormatToDate(fromDate);
      let endDate = DateUtils_default.stringFormatToDate(toDate);
      const userToken = await this.facebookRequest.getCurrentUserToken();
      for (let i = startDate; i.isSameOrBefore(endDate); i = (0, import_dayjs2.default)(i).add(1, "month")) {
        const month = i.month() + 1;
        const year = i.year();
        const commentsData = await this.facebookRequest.getCommentData(
          userToken,
          month,
          year
        );
        if (commentsData.length === 0) {
          continue;
        }
        console.log(`\u{1F680} Start deleting comments in ${month}/${year}.`);
        for (let i2 = 0; i2 < commentsData.length; i2 += batchSize) {
          const from = i2;
          const to = Math.min(i2 + batchSize, commentsData.length);
          const sliceCommentsData = commentsData.slice(from, to);
          await Promise.all(
            sliceCommentsData.map(async (commentData) => {
              await this.facebookRequest.deleteCommentById(
                userToken,
                commentData
              );
            })
          );
          console.log(`\u{1F525} Deleted ${to}/${commentsData.length} comments...`);
        }
        console.log(`\u2705 Deleted all comments in ${month}/${year} successfully.`);
      }
    };
    this.facebookRequest = new FacebookRequest_default(cookies);
  }
};
var FacebookCleaner_default = FacebookCleaner;

// src/modules/FacebookStatistics.ts
var FacebookStatistics = class {
  constructor(cookies) {
    this.getLikedPages = async (writeToCSV = true) => {
      const likedPages = await this.facebookRequest.getAllLikedPages(writeToCSV);
      return likedPages;
    };
    this.getFriends = async (writeToCSV = true) => {
      const friends = await this.facebookRequest.getAllFriends(writeToCSV);
      return friends;
    };
    this.getFollowings = async (writeToCSV = true) => {
      const following = await this.facebookRequest.getAllFollowing(writeToCSV);
      return following;
    };
    this.getJoinedGroups = async (writeToCSV = true) => {
      const joinedGroups = await this.facebookRequest.getAllJoinedGroups(
        writeToCSV
      );
      return joinedGroups;
    };
    this.getSentFriendRequests = async (writeToCSV = true) => {
      const sentFriendRequests = await this.facebookRequest.getAllSentFriendRequests(writeToCSV);
      return sentFriendRequests;
    };
    this.facebookRequest = new FacebookRequest_default(cookies);
  }
};
var FacebookStatistics_default = FacebookStatistics;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FacebookCleaner,
  FacebookStatistics
});
