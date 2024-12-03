import { existsSync } from "fs";
import path from "path";

class PathUtils {
  static getLocalDownloadDir = () => {
    const LOCAL_DOWNLOAD_DIR = path.resolve(
      process.env.USERPROFILE || "",
      "Downloads"
    );
    if (!existsSync(LOCAL_DOWNLOAD_DIR)) {
      throw new Error("❌ Cannot find the download directory on your system");
    }
    return LOCAL_DOWNLOAD_DIR;
  };

  static getSavedProfileStatisticsDirPath = (userId: string) => {
    const LOCAL_DOWNLOAD_DIR = path.resolve(
      process.env.USERPROFILE || "",
      "Downloads"
    );
    if (!existsSync(LOCAL_DOWNLOAD_DIR)) {
      throw new Error("❌ Cannot find the download directory on your system");
    }
    const BASE_DIR = path.resolve(
      LOCAL_DOWNLOAD_DIR,
      "facebook_statistics",
      userId
    );
    return {
      LIKED_PAGES: path.resolve(BASE_DIR, "liked_paged.csv"),
      FRIENDS: path.resolve(BASE_DIR, "friends.csv"),
      FOLLOWING: path.resolve(BASE_DIR, "following.csv"),
      JOINED_GROUPS: path.resolve(BASE_DIR, "joined_groups.csv"),
      SENT_FRIEND_REQUESTS: path.resolve(BASE_DIR, "sent_friend_requests.csv"),
    };
  };
}

export default PathUtils;
