import path from "path";
import { ICachedCursor } from "src/interfaces";
import FileUtils from "src/modules/utils/FileUtils";

class CacheCursor {
  static getSavedCacheCursorPath = (userId: string) => {
    const baseDir = path.resolve("cache_cursor", userId);
    return {
      POSTS_ID_CACHE_CURSOR_PATH: path.resolve(baseDir, "posts_id.json"),
    };
  };

  static writeCacheCursor = (
    userId: string,
    type: "POSTS_ID",
    cursor: ICachedCursor
  ) => {
    const { POSTS_ID_CACHE_CURSOR_PATH } = this.getSavedCacheCursorPath(userId);
    const mappedPath = {
      POSTS_ID: POSTS_ID_CACHE_CURSOR_PATH,
    };
    FileUtils.writeToFile(mappedPath[type], JSON.stringify(cursor, null, 2));
  };

  static getCacheCursor = (userId: string, type: "POSTS_ID") => {
    const { POSTS_ID_CACHE_CURSOR_PATH } = this.getSavedCacheCursorPath(userId);
    const mappedPath = {
      POSTS_ID: POSTS_ID_CACHE_CURSOR_PATH,
    };
    return FileUtils.readObjectFromJsonFile<ICachedCursor>(mappedPath[type]);
  };
}

export default CacheCursor;
