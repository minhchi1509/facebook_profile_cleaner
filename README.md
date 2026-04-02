<div align="center">
    <img src="https://raw.githubusercontent.com/minhchi1509/facebook_profile_cleaner/main/public/facebook-logo.svg" width="96" alt="Facebook logo" />
    <h1>Facebook Profile Cleaner</h1>
</div>

Automate Facebook profile cleanup and statistics export with cookie-based authentication.

## Disclaimer And Safety

- This package is not affiliated with, endorsed by, or supported by Meta/Facebook.
- This package uses reverse-engineered Facebook internal endpoints.
- Use of this package can violate Facebook Terms of Service.
- Your account may be checkpointed, temporarily locked, or permanently disabled.
- Deletion operations are destructive and cannot be undone.
- You are fully responsible for legal, policy, and account-security consequences.

## Features

- Collect friends, followings, followed pages, joined groups, sent friend requests.
- Export collected data to CSV.
- Remove friends.
- Unfollow pages.
- Leave groups.
- Unfollow users or pages.
- Cancel sent friend requests.
- Delete posts.
- Change post privacy in bulk.
- Delete reactions and comments by date window.

## Prerequisites

- Node.js >= 18.
- A valid Facebook cookie string from your logged-in browser session.
- Stable internet connection.
- File system write permission (for CSV exports and cache files).

## Installation

```bash
npm install @minhchi1509/facebook-profile-cleaner
```

## Getting Facebook Cookies

Use one of these methods:

1. Browser extension (for example Cookie-Editor), then copy cookies for facebook.com.
2. Browser DevTools -> Application/Storage -> Cookies -> facebook.com.
3. Copy the `cookie` request header from an authenticated facebook.com request.

At minimum, your cookie string usually needs valid session cookies such as `c_user`, `xs`, and related auth cookies.

Security recommendations:

- Never commit cookies to git.
- Never hardcode cookies in source files.
- Prefer environment variables or secret managers.
- Rotate cookies if you suspect leakage.

## Quick Start

```ts
import {
  FacebookCleaner,
  FacebookStatistics,
} from "@minhchi1509/facebook-profile-cleaner";

const cookies = process.env.FACEBOOK_COOKIES as string;

const statistics = new FacebookStatistics(cookies);
const cleaner = new FacebookCleaner(cookies);

const friends = await statistics.getFriends({ limit: 100 });
console.log(`Fetched ${friends.length} friends`);

await cleaner.unfollowUsersOrPages({
  concurrencySize: 2,
  delayInMs: 1500,
  limit: 50,
});
```

## Public Exports

```ts
import {
  FacebookCleaner,
  FacebookStatistics,
} from "@minhchi1509/facebook-profile-cleaner";
```

## API Reference

### Constructor Options

Both classes accept the same constructor shape:

```ts
new FacebookCleaner(cookies: string, requestOptions?: IRequestOptions)
new FacebookStatistics(cookies: string, requestOptions?: IRequestOptions)
```

`IRequestOptions`:

- `retryCount?: number` default `5`.
- `retryDelayInMs?: number` default `1000`.

Notes:

- Invalid `retryCount` or `retryDelayInMs` values fall back to defaults.
- Retries are applied to internal Facebook requests.

### FacebookStatistics

Returns arrays of `{ id, name, url }`.

Methods:

- `getFriends(options?: IGetStatisticOptions): Promise<IFriend[]>`
- `getFollowings(options?: IGetStatisticOptions): Promise<IFollowing[]>`
- `getFollowedPages(options?: IGetStatisticOptions): Promise<ILikedPages[]>`
- `getJoinedGroups(options?: IGetStatisticOptions): Promise<IJoinedGroups[]>`
- `getSentFriendRequests(options?: IGetStatisticOptions): Promise<ISentFriendRequest[]>`

`IGetStatisticOptions`:

- `writeToCSV?: boolean` default `false`.
- `savedFilePath?: string` required when `writeToCSV: true`.
- `limit?: number` default `Infinity`, must be `>= 0`.

Validation behavior:

- Throws error if `writeToCSV` is true but `savedFilePath` is missing.
- Throws error if `savedFilePath` contains invalid path characters.
- Throws error if `limit < 0` or invalid numeric value.

Example:

```ts
import { FacebookStatistics } from "@minhchi1509/facebook-profile-cleaner";

const stats = new FacebookStatistics(process.env.FACEBOOK_COOKIES as string);

const groups = await stats.getJoinedGroups({
  writeToCSV: true,
  savedFilePath: "./exports/joined-groups.csv",
  limit: 200,
});

console.log(groups[0]);
```

### FacebookCleaner

General cleaner methods:

- `removeFriends(options?: ICleanerOptions): Promise<void>`
- `unfollowPages(options?: ICleanerOptions): Promise<void>`
- `leaveGroups(options?: ICleanerOptions): Promise<void>`
- `unfollowUsersOrPages(options?: ICleanerOptions): Promise<void>`
- `cancelSentFriendRequests(options?: ICleanerOptions): Promise<void>`
- `changePostsPrivacy(options: ICleanerOptions & { privacy: "SELF" | "EVERYONE" | "FRIENDS" }): Promise<void>`

Date-window methods:

- `deletePosts(options: ICleanerOptions & { fromDate?: string; toDate?: string }): Promise<void>`
- `deleteReactions(options: ICleanerOptions & { fromDate?: string; toDate?: string }): Promise<void>`
- `deleteComments(options: ICleanerOptions & { fromDate?: string; toDate?: string }): Promise<void>`

`ICleanerOptions`:

- `concurrencySize?: number` default `5`, must be positive integer.
- `limit?: number` default `Infinity`, must be `>= 0`.
- `delayInMs?: number` default `1000`, must be `>= 0`.

Date filter rules (`deletePosts`, `deleteReactions`, `deleteComments`):

- `fromDate` and `toDate` must be provided together or both omitted.
- Format must be `MM/YYYY`.
- `fromDate` must be before or equal to `toDate`.
- If both are omitted, the operation runs on all-time history.

Example:

```ts
import { FacebookCleaner } from "@minhchi1509/facebook-profile-cleaner";

const cleaner = new FacebookCleaner(process.env.FACEBOOK_COOKIES as string, {
  retryCount: 5,
  retryDelayInMs: 1000,
});

await cleaner.deleteComments({
  fromDate: "01/2021",
  toDate: "12/2022",
  concurrencySize: 2,
  delayInMs: 2000,
  limit: 150,
});
```

## Common Errors

- `Invalid cookie`: session cookie is expired/invalid.
- Invalid cleaner/statistics options: negative limits, invalid paths, invalid concurrency values.
- Invalid date input: wrong format or invalid range.
- Facebook response shape changed: reverse-engineered endpoint may break at any time.

## Operational Risk Guidance

- Keep `concurrencySize` low (1-3) for safer execution.
- Add `delayInMs` between batches to reduce rate-limit/checkpoint risk.
- Run cleanup in small chunks using `limit`.
- Verify account status regularly while running long tasks.

## Notes About Cache Files

- Some cleanup flows may create local cache files under `cache_cursor/<userId>/`.
- Treat those files as sensitive metadata and do not commit them.
- If you need a fresh run, remove cache files intentionally.

## License

MIT

## Support

- Repository: https://github.com/minhchi1509/facebook_profile_cleaner
- Issues: https://github.com/minhchi1509/facebook_profile_cleaner/issues
