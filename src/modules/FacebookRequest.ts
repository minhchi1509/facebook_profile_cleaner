import axios, { AxiosError, AxiosInstance } from "axios";
import {
  IGetListRequestOptions,
  IGetListResponse,
  IRequestOptions,
} from "src/interfaces/common.interface";
import {
  ICommentData,
  IProfileCredentials,
  IFollowing,
  IFriend,
  IJoinedGroups,
  ILikedPages,
  IReactionData,
  ISentFriendRequest,
  IProfileTabKey,
} from "src/interfaces/model.interface";
import ObjectUtils from "src/modules/utils/ObjectUtils";

class FacebookRequest {
  private axiosInstance: AxiosInstance;
  private requestOptions: IRequestOptions;

  constructor(cookies: string, requestOptions?: IRequestOptions) {
    this.axiosInstance = axios.create({
      baseURL: "https://www.facebook.com/api/graphql",
      headers: { cookie: cookies },
    });
    this.requestOptions = {
      retryCount: requestOptions?.retryCount ?? 5,
      retryDelayInMs: requestOptions?.retryDelayInMs ?? 1000,
    };
    this.axiosInstance.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        if (error.response) {
          const responseData = error.response.data;
          throw new Error(
            `❌ Error when making request to Facebook: ${JSON.stringify(
              responseData,
              null,
              2,
            )}`,
          );
        }
        throw new Error(`❌ Unknown error: ${error.message}`);
      },
    );
  }

  getProfileCredentials = async () => {
    try {
      const { data } = await this.axiosInstance.get(
        "https://www.facebook.com/",
      );
      const userId = data.match(/"userId":(\d+)/)[1];
      const fbDtsg = data.match(/"DTSGInitialData".*?"token":"(.*?)"/)[1];
      return { userId, fbDtsg };
    } catch (error) {
      throw new Error(
        "❌ Error when getting your Facebook token: Invalid cookie",
      );
    }
  };

  getProfileTabKey = async (
    profileCredentials: IProfileCredentials,
  ): Promise<IProfileTabKey> => {
    try {
      const docID = "26299170229717540";
      const query = {
        scale: 1,
        selectedID: profileCredentials.userId,
        selectedSpaceType: "profile",
        shouldUseFXIMProfilePicEditor: false,
        userID: profileCredentials.userId,
      };
      const headers = {
        "x-fb-friendly-name": "ProfileCometHeaderQuery",
      };
      const responseTextData = await this.makeRequestToFacebook({
        docID,
        query,
        profileCredentials,
        headers,
      });

      if (typeof responseTextData !== "string") {
        throw new Error();
      }
      const originalData = JSON.parse(
        responseTextData.split("\n")?.[0] ?? "null",
      );

      const findTabIdByKey = (key: string): string => {
        return (
          ObjectUtils.findByKey<string>({
            data: originalData,
            key: "id",
            condition: (candidate, container): candidate is string => {
              return typeof candidate === "string" && container.tab_key === key;
            },
          }) || ""
        );
      };

      const friendsAllTabKeyId = findTabIdByKey("friends_all");
      const followingTabKeyId = findTabIdByKey("following");

      return { friendsAllTabKeyId, followingTabKeyId };
    } catch (error) {
      throw new Error(
        "❌ Error when getting profile tab key: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  private makeRequestToFacebook = async ({
    docID,
    query,
    profileCredentials,
    headers,
  }: {
    profileCredentials: IProfileCredentials;
    docID: string;
    query: any;
    headers?: Record<string, string>;
  }) => {
    const formData = new FormData();
    formData.set("__a", "1");
    formData.set("__comet_req", "15");
    formData.set("fb_dtsg", profileCredentials.fbDtsg);
    formData.set("av", profileCredentials.userId);
    formData.set("doc_id", docID);
    formData.set("variables", JSON.stringify(query));
    const { data } = await this.axiosInstance.post("/", formData, { headers });
    return data;
  };

  getFollowedPages = async ({
    cursor,
    profileCredentials,
  }: IGetListRequestOptions): Promise<IGetListResponse<ILikedPages>> => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const query = {
      ranking_model: "INTEGRITY_SIGNALS",
      scale: 1,
      id: profileCredentials?.userId || credentials.userId,
      __relay_internal__pv__StoriesRingrelayprovider: false,
      count: 20,
      ...(cursor && { cursor }),
    };
    const docID = "29841836082128490";
    const headers = {
      "x-fb-friendly-name": "PagesCometAllLikedPagesSectionPaginationQuery",
    };

    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });

    const originalLikedPagesList =
      responseData?.data?.node?.sorted_liked_and_followed_pages?.edges;
    const pageInfor =
      responseData?.data?.node?.sorted_liked_and_followed_pages?.page_info;
    if (!originalLikedPagesList || !pageInfor) {
      throw new Error(
        "❌ Error when getting liked pages: Response data is missing expected fields.",
      );
    }

    const likedPages: ILikedPages[] = originalLikedPagesList.map(
      ({ node }: any) => ({
        id: node.id,
        name: node.name,
        url: node.url,
      }),
    );
    const hasNextPage = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: likedPages,
      pagination: {
        hasMore: hasNextPage,
        nextCursor,
      },
    };
  };

  getFriends = async ({
    cursor,
    profileCredentials,
    profileTabKey,
  }: IGetListRequestOptions): Promise<IGetListResponse<IFriend>> => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const tabKey = profileTabKey || (await this.getProfileTabKey(credentials));

    const query = {
      count: 8,
      scale: 1,
      search: null,
      id: tabKey.friendsAllTabKeyId,
      __relay_internal__pv__FBProfile_enable_perf_improv_gkrelayprovider: true,
      ...(cursor && { cursor }),
    };
    const docID = "27075075378761750";
    const headers = {
      "x-fb-friendly-name":
        "ProfileCometAppCollectionSelfFriendsListRendererPaginationQuery",
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });

    const originalFriendsList = responseData?.data?.node?.pageItems?.edges;
    const pageInfor = responseData?.data?.node?.pageItems?.page_info;
    if (!originalFriendsList || !pageInfor) {
      throw new Error(
        "❌ Error when getting friends: Response data is missing expected fields.",
      );
    }

    const friends: IFriend[] = originalFriendsList.map(({ node }: any) => ({
      id: node.actions_renderer.action.profile_owner.id,
      name: node.actions_renderer.action.profile_owner.name,
      url: node.url,
    }));

    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: friends,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  };

  getFollowing = async ({
    cursor,
    profileCredentials,
    profileTabKey,
  }: IGetListRequestOptions): Promise<IGetListResponse<IFollowing>> => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const tabKey = profileTabKey || (await this.getProfileTabKey(credentials));

    const query = {
      id: tabKey.followingTabKeyId,
      count: 8,
      scale: 1,
      search: null,
      __relay_internal__pv__FBProfile_enable_perf_improv_gkrelayprovider: true,
      ...(cursor && { cursor }),
    };
    const docID = "26138331632454030";
    const headers = {
      "x-fb-friendly-name":
        "ProfileCometAppCollectionListRendererPaginationQuery",
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });

    const originalFollowingList = responseData?.data?.node?.pageItems?.edges;
    const pageInfor = responseData?.data?.node?.pageItems?.page_info;
    if (!originalFollowingList || !pageInfor) {
      throw new Error(
        "❌ Error when getting following: Response data is missing expected fields.",
      );
    }

    const following: IFollowing[] = originalFollowingList.map(
      ({ node }: any) => ({
        id: node.node.id,
        name: node.title.text,
        url: node.node.url,
      }),
    );
    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;

    return {
      data: following,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  };

  getJoinedGroups = async ({
    cursor,
    profileCredentials,
  }: IGetListRequestOptions): Promise<IGetListResponse<IJoinedGroups>> => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const query = {
      ordering: ["integrity_signals"],
      scale: 1,
      count: 20,
      ...(cursor && { cursor }),
    };
    const docID = "9974006939348139";
    const headers = {
      "x-fb-friendly-name": "GroupsCometAllJoinedGroupsSectionPaginationQuery",
    };

    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });

    const originalJoinedGroupsList =
      responseData?.data?.viewer?.all_joined_groups?.tab_groups_list?.edges;
    const pageInfor =
      responseData?.data?.viewer?.all_joined_groups?.tab_groups_list?.page_info;
    if (!originalJoinedGroupsList || !pageInfor) {
      throw new Error(
        "❌ Error when getting joined groups: Response data is missing expected fields.",
      );
    }

    const joinedGroups: IJoinedGroups[] = originalJoinedGroupsList.map(
      ({ node }: any) => ({
        id: node.id,
        name: node.name,
        url: node.url,
      }),
    );
    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: joinedGroups,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  };

  getSentFriendRequests = async ({
    cursor,
    profileCredentials,
  }: IGetListRequestOptions): Promise<IGetListResponse<ISentFriendRequest>> => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());

    const query = {
      scale: 1,
      count: 10,
      ...(cursor && { cursor }),
    };
    const docID = "9776114965832879";
    const headers = {
      "x-fb-friendly-name":
        "FriendingCometOutgoingRequestsDialogPaginationQuery",
    };

    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });

    const originalSentFriendRequests =
      responseData?.data?.viewer?.outgoing_friend_requests_connection?.edges;
    const pageInfor =
      responseData?.data?.viewer?.outgoing_friend_requests_connection
        ?.page_info;
    if (!originalSentFriendRequests || !pageInfor) {
      throw new Error(
        "❌ Error when getting sent friend requests: Response data is missing expected fields.",
      );
    }

    const sentFriendRequests: ISentFriendRequest[] =
      originalSentFriendRequests.map(({ node }: any) => ({
        id: node.id,
        name: node.name,
        url: node.url,
      }));
    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;
    return {
      data: sentFriendRequests,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  };

  getProfilePostsId = async ({
    cursor,
    profileCredentials,
  }: IGetListRequestOptions): Promise<IGetListResponse<string>> => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const query = {
      ...(cursor && { cursor }),
      afterTime: null,
      beforeTime: null,
      count: 3,
      feedLocation: "TIMELINE",
      feedbackSource: 0,
      focusCommentID: null,
      memorializedSplitTimeFilter: null,
      omitPinnedPost: true,
      postedBy: null,
      privacy: null,
      privacySelectorRenderLocation: "COMET_STREAM",
      referringStoryRenderLocation: null,
      renderLocation: "timeline",
      scale: 1,
      stream_count: 1,
      taggedInOnly: null,
      trackingCode: null,
      useDefaultActor: false,
      id: credentials.userId,
      __relay_internal__pv__GHLShouldChangeAdIdFieldNamerelayprovider: true,
      __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider: true,
      __relay_internal__pv__CometFeedStory_enable_post_permalink_white_space_clickrelayprovider: false,
      __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider: false,
      __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider: false,
      __relay_internal__pv__IsWorkUserrelayprovider: false,
      __relay_internal__pv__TestPilotShouldIncludeDemoAdUseCaserelayprovider: false,
      __relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider: true,
      __relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider: true,
      __relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider: false,
      __relay_internal__pv__WorkCometIsEmployeeGKProviderrelayprovider: false,
      __relay_internal__pv__IsMergQAPollsrelayprovider: false,
      __relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider: true,
      __relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider: false,
      __relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider:
        "ORIGINAL",
      __relay_internal__pv__CometUFIShareActionMigrationrelayprovider: true,
      __relay_internal__pv__CometUFISingleLineUFIrelayprovider: false,
      __relay_internal__pv__CometUFI_dedicated_comment_routable_dialog_gkrelayprovider: true,
      __relay_internal__pv__FBReelsIFUTileContent_reelsIFUPlayOnHoverrelayprovider: true,
      __relay_internal__pv__GroupsCometGYSJFeedItemHeightrelayprovider: 206,
      __relay_internal__pv__ShouldEnableBakedInTextStoriesrelayprovider: true,
      __relay_internal__pv__StoriesShouldIncludeFbNotesrelayprovider: true,
    };
    const docID = "26662827129980518";
    const headers = {
      "x-fb-friendly-name": "ProfileCometTimelineFeedRefetchQuery",
    };

    const postIdRegex = /"post_id":"(.*?)","cix_screen":/g;
    const pageInforRegex = /"data":\{"page_info":(.*?)\},"extensions"/;
    const responseText = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });
    const postsId: string[] = [];
    const postsIdTemp: string[] = [];
    const pageInfoInText = pageInforRegex.exec(responseText)?.[1];
    if (!pageInfoInText) {
      throw new Error("Failed to extract page info from response");
    }
    const pageInfo = JSON.parse(pageInfoInText);
    let match;
    while ((match = postIdRegex.exec(responseText)) !== null) {
      if (match[1] && match[1].length < 30) {
        postsIdTemp.push(match[1]);
      }
    }
    postsId.push(...postsIdTemp);

    const hasMore = pageInfo.has_next_page;
    const nextCursor = pageInfo.end_cursor;

    return {
      data: postsId,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  };

  getReactionData = async ({
    cursor,
    profileCredentials,
    month,
    year,
  }: IGetListRequestOptions & { month?: number; year?: number }): Promise<
    IGetListResponse<IReactionData>
  > => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const query = {
      ...(cursor && { cursor }),
      audience: null,
      category: "LIKEDPOSTS",
      category_key: "LIKEDPOSTS",
      count: 25,
      feedLocation: null,
      media_content_filters: [],
      month: month || null,
      person_id: null,
      privacy: "NONE",
      scale: 1,
      timeline_visibility: "ALL",
      year: year || null,
      id: credentials.userId,
    };
    const docID = "26612632988372046";
    const headers = {
      "x-fb-friendly-name": "CometActivityLogStoriesListPaginationQuery",
    };
    let responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });
    if (typeof responseData !== "object") {
      responseData = JSON.parse(responseData.split("\n")[0]);
    }

    const originalReactionsData =
      responseData?.data?.viewer?.activity_log_actor?.activity_log_stories
        ?.edges;
    const pageInfor =
      responseData?.data?.viewer?.activity_log_actor?.activity_log_stories
        ?.page_info;

    if (!originalReactionsData || !pageInfor) {
      throw new Error(`Failed to extract reaction data for ${month}/${year}`);
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

    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;

    return {
      data: reactionsData,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  };

  getCommentData = async ({
    cursor,
    profileCredentials,
    month,
    year,
  }: IGetListRequestOptions & { month?: number; year?: number }): Promise<
    IGetListResponse<ICommentData>
  > => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());

    const query = {
      id: credentials.userId,
      ...(cursor && { cursor }),
      month: month || null,
      year: year || null,

      audience: null,
      category: "COMMENTSCLUSTER",
      category_key: "COMMENTSCLUSTER",
      count: 25,
      feedLocation: null,
      media_content_filters: [],
      person_id: null,
      privacy: "NONE",
      scale: 1,
      timeline_visibility: "ALL",
    };
    const docID = "26612632988372046";
    const headers = {
      "x-fb-friendly-name": "CometActivityLogStoriesListPaginationQuery",
    };
    let responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });
    if (typeof responseData !== "object") {
      responseData = JSON.parse(responseData.split("\n")[0]);
    }

    const originalCommentsData =
      responseData?.data?.viewer?.activity_log_actor?.activity_log_stories
        ?.edges;
    const pageInfor =
      responseData?.data?.viewer?.activity_log_actor?.activity_log_stories
        ?.page_info;
    if (!originalCommentsData || !pageInfor) {
      throw new Error(`Failed to extract comment data for ${month}/${year}`);
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

    const hasMore = pageInfor.has_next_page;
    const nextCursor = pageInfor.end_cursor;

    return {
      data: commentsData,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  };

  unfriend = async ({
    profileCredentials,
    friendId,
  }: {
    profileCredentials?: IProfileCredentials;
    friendId: string;
  }) => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID: "24028849793460009",
      query: {
        input: {
          source: "bd_profile_button",
          unfriended_user_id: friendId,
          actor_id: credentials.userId,
          client_mutation_id: "6",
        },
        scale: 1,
      },
      headers: {
        "x-fb-friendly-name": "FriendingCometUnfriendMutation",
      },
    });
    if (!responseData?.data?.friend_remove?.unfriended_person?.id) {
      throw new Error(`❌ Error when unfriending ${friendId}.`);
    }
  };

  unfollowPage = async ({
    profileCredentials,
    pageId,
  }: {
    profileCredentials?: IProfileCredentials;
    pageId: string;
  }) => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const docID = "23977842521823837";
    const query = {
      input: {
        subscribe_location: "PAGE_FAN",
        unsubscribee_id: pageId,
        actor_id: credentials.userId,
        client_mutation_id: "6",
      },
    };
    const headers = {
      "x-fb-friendly-name": "usePageCometUnfollowMutation",
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });
    if (!responseData?.data?.actor_unsubscribe?.unsubscribee?.id) {
      throw new Error(`❌ Error when unfollowing page with ID ${pageId}.`);
    }
  };

  leaveGroup = async ({
    profileCredentials,
    groupId,
  }: {
    profileCredentials?: IProfileCredentials;
    groupId: string;
  }) => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const docID = "24361296076901408";
    const query = {
      groupID: groupId,
      input: {
        action_source: "COMET_GROUP_PAGE",
        attribution_id_v2:
          "GroupsCometJoinsRoot.react,comet.groups.joins,unexpected,1774971471296,865482,,,;GroupsCometCrossGroupFeedRoot.react,comet.groups.feed,tap_bookmark,1774971466617,45981,2361831622,,",
        group_id: groupId,
        readd_policy: "ALLOW_READD",
        actor_id: credentials.userId,
        client_mutation_id: "9",
      },
      ordering: ["viewer_added"],
      scale: 1,
    };
    const headers = {
      "x-fb-friendly-name": "useGroupLeaveMutation",
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });
    if (!responseData?.data?.group_leave?.group?.id) {
      throw new Error(`❌ Error when leaving group with ID ${groupId}.`);
    }
  };

  unfollowUserOrPage = async ({
    profileCredentials,
    userOrPageId,
  }: {
    profileCredentials?: IProfileCredentials;
    userOrPageId: string;
  }) => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const docID = "27282909147964207";
    const query = {
      action_render_location: "WWW_COMET_FRIEND_MENU",
      input: {
        is_tracking_encrypted: false,
        subscribe_location: "PROFILE",
        tracking: null,
        unsubscribee_id: userOrPageId,
        actor_id: credentials.userId,
        client_mutation_id: "10",
      },
      scale: 1,
    };
    const headers = {
      "x-fb-friendly-name": "CometUserUnfollowMutation",
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });
    if (!responseData?.data?.actor_unsubscribe?.unsubscribee?.id) {
      throw new Error(
        `❌ Error when unfollowing user or page with ID ${userOrPageId}.`,
      );
    }
  };

  cancelSentFriendRequest = async ({
    profileCredentials,
    userId,
  }: {
    profileCredentials?: IProfileCredentials;
    userId: string;
  }) => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const docID = "24453541284254355";
    const query = {
      input: {
        cancelled_friend_requestee_id: userId,
        click_correlation_id: String(Date.now()),
        click_proof_validation_result: '{"validated":true}',
        friending_channel: "MANAGE_OUTGOING_REQUESTS",
        actor_id: credentials.userId,
        client_mutation_id: "4",
      },
      scale: 1,
    };
    const headers = {
      "x-fb-friendly-name": "FriendingCometFriendRequestCancelMutation",
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });
    if (
      !responseData?.data?.friend_request_cancel?.cancelled_friend_requestee?.id
    ) {
      throw new Error(
        `❌ Error when canceling sent friend request to user with ID ${userId}.`,
      );
    }
  };

  deletePost = async ({
    profileCredentials,
    postId,
  }: {
    profileCredentials?: IProfileCredentials;
    postId: string;
  }) => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const { userId } = credentials;
    const docID = "26146132388368957";
    const query = {
      input: {
        story_id: btoa(`S:_I${userId}:${postId}:${postId}`),
        story_location: "TIMELINE",
        actor_id: userId,
        client_mutation_id: "2",
      },
    };
    const headers = {
      "x-fb-friendly-name": "useCometTrashPostMutation",
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });
    if (!responseData?.data?.move_to_trash_story?.success) {
      throw new Error(`❌ Error when deleting post with ID ${postId}.`);
    }
  };

  changePostPrivacy = async ({
    profileCredentials,
    postId,
    privacy,
  }: {
    profileCredentials?: IProfileCredentials;
    postId: string;
    privacy: "SELF" | "EVERYONE" | "FRIENDS";
  }) => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
    const { userId } = credentials;
    const docID = "34450894234558788";
    const query = {
      input: {
        privacy_mutation_token: null,
        privacy_row_input: {
          allow: [],
          base_state: privacy,
          deny: [],
          tag_expansion_state: "UNSPECIFIED",
        },
        privacy_write_id: btoa(`privacy_scope_renderer:{"id":${postId}}`),
        render_location: "COMET_STORY_MENU",
        actor_id: userId,
        client_mutation_id: "4",
      },
      privacySelectorRenderLocation: "COMET_STORY_MENU",
      scale: 1,
      storyRenderLocation: "timeline",
      tags: null,
      __relay_internal__pv__CometUFIShareActionMigrationrelayprovider: true,
      __relay_internal__pv__CometUFISingleLineUFIrelayprovider: true,
    };
    const headers = {
      "x-fb-friendly-name": "CometPrivacySelectorSavePrivacyMutation",
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });
    if (
      !responseData?.data?.privacy_selector_save?.privacy_scope
        ?.privacy_scope_renderer?.id
    ) {
      throw new Error(
        `❌ Error when changing privacy of post with ID ${postId}.`,
      );
    }
  };

  deleteReaction = async ({
    profileCredentials,
    reactionData,
  }: {
    profileCredentials?: IProfileCredentials;
    reactionData: IReactionData;
  }) => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
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
        client_mutation_id: "8",
      },
    };
    const headers = {
      "x-fb-friendly-name": "CometActivityLogItemCurationMutation",
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });
    if (!responseData?.data?.activity_log_story_curation?.success) {
      throw new Error(
        `❌ Error when deleting reaction with story ID ${reactionData.storyId} and post ID ${reactionData.postId}.`,
      );
    }
  };

  deleteCommentById = async ({
    profileCredentials,
    commentData,
  }: {
    profileCredentials?: IProfileCredentials;
    commentData: ICommentData;
  }) => {
    const credentials =
      profileCredentials || (await this.getProfileCredentials());
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
        client_mutation_id: "9",
      },
    };
    const headers = {
      "x-fb-friendly-name": "CometActivityLogItemCurationMutation",
    };
    const responseData = await this.makeRequestToFacebook({
      profileCredentials: credentials,
      docID,
      query,
      headers,
    });
    if (!responseData?.data?.activity_log_story_curation?.success) {
      throw new Error(
        `❌ Error when deleting comment with story ID ${commentData.storyId} and post ID ${commentData.postId}.`,
      );
    }
  };
}

export default FacebookRequest;
