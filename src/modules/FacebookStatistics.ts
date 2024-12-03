import FacebookRequest from "src/modules/FacebookRequest";

class FacebookStatistics {
  private facebookRequest: FacebookRequest;

  constructor(cookies: string) {
    this.facebookRequest = new FacebookRequest(cookies);
  }

  getLikedPages = async (writeToCSV: boolean = true) => {
    const likedPages = await this.facebookRequest.getAllLikedPages(writeToCSV);
    return likedPages;
  };

  getFriends = async (writeToCSV: boolean = true) => {
    const friends = await this.facebookRequest.getAllFriends(writeToCSV);
    return friends;
  };

  getFollowings = async (writeToCSV: boolean = true) => {
    const following = await this.facebookRequest.getAllFollowing(writeToCSV);
    return following;
  };

  getJoinedGroups = async (writeToCSV: boolean = true) => {
    const joinedGroups = await this.facebookRequest.getAllJoinedGroups(
      writeToCSV
    );
    return joinedGroups;
  };

  getSentFriendRequests = async (writeToCSV: boolean = true) => {
    const sentFriendRequests =
      await this.facebookRequest.getAllSentFriendRequests(writeToCSV);
    return sentFriendRequests;
  };
}

export default FacebookStatistics;
