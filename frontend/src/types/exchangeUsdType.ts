// Define related interfaces
export interface Accounts {
  id: number;
  accountId: number;
  name: string;
  phone: string;
  address: string;
  accountTypeId: number;
}

export interface Admin {
  id: number;
  name: string;
  phone: string;
  image?: string;
  role: string;
  // Add other user properties as needed
}

export interface Account {
  accountId: number;
  name: string;
  phone: string;
  address: string;
}

export interface Currency {
  currencyId: number;
  currency: string;
}

export interface PaginationParams {
  parPage: number;
  page: number;
  searchValue: string;
  carType: string;
}

export interface GetExchangeUsdParams {
   accountId?: number;
  page: number;
  parPage: number;
  searchValue?: string;
  exchangeTypeId:number;
  sortBy?: "createdAt" | "amountUsd" | "voucherNo";
  sortOrder?: "asc" | "desc";
  fromDate?: Date | null;
  toDate?: Date | null;
}

export interface PaginationOverdueParams {
  parPage: number;
  page: number;
  searchValue: string;
}

export interface CarName {
  id: number;
  carType: string;
}

export interface CarNamesResponse {
  carNames: CarName[];
}

export interface ExchangeUSD {
  id: number;
  voucherNo: number;
  fiscalYear: number;
  exchangeTypeId: number;
  exchangeType: string;
  currencyId: number;
  accountId: number;
  amountUsd: number;
  price: number;
  amountIqd: number;
  createdAt: Date;
  note: string;
  adminId: number;
  account?: Accounts;
  admin?: Admin;
}

export interface ExchangeUSDState {
  UsdVoucherNo?: number;
  exchangeTypeId: number;
  exchangeType: string;
  currencyId: number;
  accountId: number;
  amountUsd: number;
  price: number;
  amountIqd: number;
  createdAt: Date;
  note: string;
  adminId: number;
}

export interface ExchangeState {
  exchangeTypeId: number;
  exchangeType: string;

}

export type UpdateExchangeUSDData = ExchangeUSDState & {
  id: number;
  voucherNo: number;
  currencyType: string;
  typeId: number;
  type: string;
  Hmula_ID: number;
  ExchangeUsd_ID: number;
};

export interface UpdateLastPayOrder {
  voucherNo: number;
  lastPayDate: Date;
}

export interface UpdateCarImportStatus {
  voucherNo: number;
  incomeStatus: string;
  // totalRemain:number;
}

export interface ApiPagination {
  total: number;
  totalPage: number;
  currentPage: number;
  perPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationState {
  totalPage: number;
  currentPage: number;
  perPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type ExchangeUsdByVoucherTypePayload = {
  voucherNo: number;
  exchangeUsd?: ExchangeUSD;
};

export type DeleteExchangeUSdTypePayload = {
  id?: number;
  voucherNo?: number;
  fiscalYear?: number;
  typeId: number;
  deleteExchangeUsd?: ExchangeUSD;
};


