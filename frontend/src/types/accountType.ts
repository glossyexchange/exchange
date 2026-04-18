export interface AccountTypes {
  id: number;
    type: string;
  // start: number;
  // end: number;
}

export interface PaginationParams {
  parPage: number;
  page: number;
  searchValue: string;
}

export interface CreateInfo {
  type: string;
 
}

export interface UpdateInfo {
    id: number;
 info: CreateInfo;
}

export 
type DeleteAccountTypePayload = {
  id: number;

};

export interface GetLastAccountIdParams {
  accountTypeId: number;
}