import dayjs from "dayjs";
import FacebookRequest from "src/modules/FacebookRequest";
import DateUtils from "src/modules/utils/DateUtils";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrBefore);

class FacebookCleaner {
  private facebookRequest: FacebookRequest;

  constructor(cookies: string) {
    this.facebookRequest = new FacebookRequest(cookies);
  }

  removeAllFriends = async (batchSize: number = 5) => {
    await this.facebookRequest.removeAllFriends(batchSize);
  };

  removeAllLikedPages = async (batchSize: number = 5) => {
    await this.facebookRequest.removeAllLikedPages(batchSize);
  };

  leaveAllGroups = async (batchSize: number = 1) => {
    await this.facebookRequest.leaveAllJoinedGroups(batchSize);
  };

  unfollowAllPagesAndUsers = async (batchSize: number = 1) => {
    await this.facebookRequest.unfollowAllPagesAndUsers(batchSize);
  };

  cancelAllSentFriendRequests = async (batchSize: number = 5) => {
    await this.facebookRequest.cancelAllSentFriendRequests(batchSize);
  };

  deletePosts = async (limit: number = Infinity, batchSize: number = 5) => {
    await this.facebookRequest.deleteProfilePosts(limit, batchSize);
  };

  changePostsPrivacy = async (
    privacy: "SELF" | "EVERYONE" | "FRIENDS",
    limit: number = Infinity,
    batchSize: number = 5
  ) => {
    await this.facebookRequest.changePostsPrivacy(privacy, limit, batchSize);
  };

  deleteReactions = async (
    fromDate: string,
    toDate: string,
    batchSize: number = 5
  ) => {
    if (!DateUtils.isValidTwoDate(fromDate, toDate)) {
      throw new Error(
        "❌ Invalid date input. Start date must be before or equal to end date and it must be in MM/YYYY format."
      );
    }

    let startDate = DateUtils.stringFormatToDate(fromDate);
    let endDate = DateUtils.stringFormatToDate(toDate);
    const userToken = await this.facebookRequest.getCurrentUserToken();

    for (
      let i = startDate;
      i.isSameOrBefore(endDate);
      i = dayjs(i).add(1, "month")
    ) {
      const month = i.month() + 1; // month() trả về 0-11, nên cần +1
      const year = i.year();
      const reactionsData = await this.facebookRequest.getReactionData(
        userToken,
        month,
        year
      );

      if (reactionsData.length === 0) {
        continue;
      }
      console.log(`🚀 Start deleting reactions in ${month}/${year}.`);
      for (let i = 0; i < reactionsData.length; i += batchSize) {
        const from = i;
        const to = Math.min(i + batchSize, reactionsData.length);
        const sliceReactionsData = reactionsData.slice(from, to);
        await Promise.all(
          sliceReactionsData.map(async (reactionData) => {
            await this.facebookRequest.deleteReactionById(
              userToken,
              reactionData
            );
          })
        );
        console.log(`🔥 Deleted ${to}/${reactionsData.length} reactions...`);
      }
      console.log(`✅ Deleted all reactions in ${month}/${year} successfully.`);
    }
  };

  deleteComments = async (
    fromDate: string,
    toDate: string,
    batchSize: number = 5
  ) => {
    if (!DateUtils.isValidTwoDate(fromDate, toDate)) {
      throw new Error(
        "❌ Invalid date input. Start date must be before or equal to end date and it must be in MM/YYYY format."
      );
    }

    let startDate = DateUtils.stringFormatToDate(fromDate);
    let endDate = DateUtils.stringFormatToDate(toDate);
    const userToken = await this.facebookRequest.getCurrentUserToken();
    for (
      let i = startDate;
      i.isSameOrBefore(endDate);
      i = dayjs(i).add(1, "month")
    ) {
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
      console.log(`🚀 Start deleting comments in ${month}/${year}.`);
      for (let i = 0; i < commentsData.length; i += batchSize) {
        const from = i;
        const to = Math.min(i + batchSize, commentsData.length);
        const sliceCommentsData = commentsData.slice(from, to);
        await Promise.all(
          sliceCommentsData.map(async (commentData) => {
            await this.facebookRequest.deleteCommentById(
              userToken,
              commentData
            );
          })
        );
        console.log(`🔥 Deleted ${to}/${commentsData.length} comments...`);
      }
      console.log(`✅ Deleted all comments in ${month}/${year} successfully.`);
    }
  };
}

export default FacebookCleaner;
