<div align="center">
    <img src="https://raw.githubusercontent.com/minhchi1509/facebook_profile_cleaner/main/public/facebook-logo.svg" width="10%" />
    <br />
     <h1 align="center">Facebook Profile Cleaner</h1>
</div>

## Features

- Get liked pages, friends, followings, joined groups, sent friend requests and write to CSV file (if need)
- Remove all friends.
- Remove all liked pages.
- Leave all groups.
- Unfollow all pages or users
- Cancel all sent friend requests
- Change privacy of all posts (public, friend, private)
- Delete all posts
- Delete reactions, comments in given time interval


## Installation

```bash
npm install @minhchi1509/facebook-profile-cleaner
```

## Usage

- Example of writing your profile statistics:

```js
import { FacebookStatistics } from "@minhchi1509/facebook-profile-cleaner";

// Cookies of your Facebook account. You can get it by using Cookie-Editor extension on Chrome
const cookies = "YOUR_FACEBOOK_COOKIES";

const facebookStatistics = new FacebookStatistics(cookies);

facebookStatistics.getFriends();
facebookStatistics.getFollowings();
facebookStatistics.getLikedPages();
facebookStatistics.getJoinedGroups();
facebookStatistics.getSentFriendRequests();
```
- Example of cleaning your profile:
```js
import { FacebookCleaner } from "@minhchi1509/facebook-profile-cleaner";

// Cookies of your Facebook account. You can get it by using Cookie-Editor extension on Chrome
const cookies = "YOUR_FACEBOOK_COOKIES";

const facebookCleaner = new FacebookCleaner(cookies);

facebookCleaner.removeAllFriends();
facebookCleaner.removeAllLikedPages();
facebookCleaner.leaveAllGroups();
facebookCleaner.unfollowAllPagesAndUsers();
facebookCleaner.cancelAllSentFriendRequests();
facebookCleaner.deletePosts();
facebookCleaner.changePostsPrivacy("FRIENDS");
facebookCleaner.deleteReactions("08/2020", "12/2022");
facebookCleaner.deleteComments("08/2020", "12/2022");
```

## API Documentation

### Writing profile statistics:

```js
facebookStatistics.getFriends(writeToCSV: boolean = true);
facebookStatistics.getFollowings(writeToCSV: boolean = true);
facebookStatistics.getLikedPages(writeToCSV: boolean = true);
facebookStatistics.getJoinedGroups(writeToCSV: boolean = true);
facebookStatistics.getSentFriendRequests(writeToCSV: boolean = true);
```

**Parameters**:
- **writeToCSV** _(boolean, optional)_: If `true`, it will write statistic to CSV file and save to your Download folder. Default value: `true`.

### Clean profile:
```js
facebookCleaner.removeAllFriends(batchSize: number = 5);
facebookCleaner.removeAllLikedPages(batchSize: number = 5);
facebookCleaner.leaveAllGroups(batchSize: number = 1);
facebookCleaner.unfollowAllPagesAndUsers(batchSize: number = 1);
facebookCleaner.cancelAllSentFriendRequests(batchSize: number = 5);
facebookCleaner.deletePosts(limit: number = Infinity, batchSize: number = 5); // Limit must be multiple of 3
facebookCleaner.changePostsPrivacy(privacy: "SELF" | "EVERYONE" | "FRIENDS", limit: number = Infinity, batchSize: number = 5); // Limit must be multiple of 3
facebookCleaner.deleteReactions(fromDate: string, toDate: string, batchSize: number = 5);
facebookCleaner.deleteComments(fromDate: string, toDate: string, batchSize: number = 5);
```
**Parameters**:
- **batchSize** _(number, optional)_: Number of items that will be executed simultaneously.
- **limit** _(number, optional)_: Number of posts in 1 execution. Suitable when your profile has many posts and you want to execute the code multiple times.
- **fromDate**, **toDate** _(string, required)_: It mus be in format "MM/YYYY" (example: "02/2024" and `fromDate` must be before or equal to `toDate`.

> [!WARNING]
> Note that when you specify the value of `limit` parameter, after the batch execution is complete, there will be a folder named **cache_cursor/[user_id]** and it contains files like **posts_id.json** to save information for the next execution. Please **DO NOT** edit anything in these files.
> If you want to execute again, delete that file.

> [!WARNING]
> When you specify `batchSize` larger than the default value, your Facebook account **MAY BE CHECKPOINTED**, please consider.

