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
  currencySymbol:string;
  CurrencyPrice:number;
}

export interface PaginationParams {
  parPage: number;
  page: number;
  searchValue: string;

}

export interface GetExchangeAllParams {
   accountId?: number;
  page: number;
  parPage: number;
  searchValue?: string;
  exchangeTypeId:number;
  currencyId?:number;
  sortBy?: "createdAt" | "amountUsd" | "voucherNo";
  sortOrder?: "asc" | "desc";
  fromDate?: Date | null;
  toDate?: Date | null;
}



export interface ExchangeAll {
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
  currency?: Currency
}

export interface ExchangeAllState {
  allVoucherNo?: number;
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

export interface ExchangeCurremciesState {
  exchangeTypeId: number;
  exchangeType: string;
  currencyId: number;
  currencyName:string;
}

export type UpdateExchangeAllData = ExchangeAllState & {
  id?: number;
  voucherNo: number;
  currencyType: string;
  typeId: number;
  type: string;
  Hmula_ID: number;
  ExchangeAll_ID: number;
};

export interface UpdateLastPayOrder {
  voucherNo: number;
  lastPayDate: Date;
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
  exchangeUsd?: ExchangeAll;
};


export type DeleteExchangeAllTypePayload = {
 id?: number;
  voucherNo?: number;
  fiscalYear?: number;
  typeId: number;
  deleteExchangeAll?: ExchangeAll;
};
