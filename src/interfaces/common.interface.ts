import {
  IProfileCredentials,
  IProfileTabKey,
} from "src/interfaces/model.interface";

export interface IGetListResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor: string;
  };
}

export interface IRequestOptions {
  retryCount?: number;
  retryDelayInMs?: number;
}

export interface IGetListRequestOptions {
  cursor: string;
  profileCredentials?: IProfileCredentials;
  profileTabKey?: IProfileTabKey;
}
