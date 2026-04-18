export interface Accounts {
  id: number;
  accountId: number;
  name: string;
  phone: string;
  address: string;
  accountTypeId: number;
}

export interface Currency {
  currencyId: number;
  currency: string;
}


export interface GetMovementsParams {
  currencyId?: number;
  fiscalYear?:number;
  accountId?: number;
  page: number;
  parPage: number;
  searchValue?: string;
  sortBy?: 'createdAt' | 'totalAmount' | 'voucherNo';
  sortOrder?: 'asc' | 'desc';
  fromDate?: Date | null;
  toDate?: Date | null;
}

export interface Movements {
  id: number;
  currencyId: number;
  currencyType: string;
  typeId:number;
  type: string;
  voucherNo: number;
  createdAt: Date;
  debtorId: number;
  amountTaking: number;
  creditorId: number;
  amountPay: number;
  note: string;

  account?: Accounts;
}

export interface MovementState {
  currencyId: number;
  currencyType: string;
  typeId:number;
  type: string;
  voucherNo: number;
  createdAt: Date;
  debtorId: number;
  amountTaking: number;
  creditorId: number;
  amountPay: number;
  note: string;
}

export interface UpdateMovementState {
  currencyId: number;
  currencyType: string;
  typeId:number;
  type: string;
  createdAt: Date;
  debtorId: number;
  amountTaking: number;
  creditorId: number;
  amountPay: number;
  note: string;
}

export interface UpdateMovement {
  voucherNo: number;
  info: UpdateMovementState;
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
  total: number;
  totalPage: number;
  currentPage: number;
  perPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type DeleteMovementTypePayload = {
  voucherNo: number;
  deletedPaymnet?: Movements;
};

export interface GetAccountBalanceParams {
  accountIds: number[]; // support multiple accounts
  currencyId?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface AccountBalance {
  accountId: number;
  amountTaking: number;
  amountPay: number;
  balance: number;
  status: string;
  currency: string;
}

export interface BalanceAccount {
  accountId: number;
  accountName: string;
  netBalance: string;
  status: "creditor" | "debtor" | "neutral";   // allow neutral for zero balances
}

// 2. Update the response interface to include pagination
export interface GeneralBalanceResponse {
  data: BalanceAccount[];
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message: string;
}

// 3. Update params to include pagination fields
export interface GeneralBalanceParams {
  currencyId: number;
  fiscalYear?: number;
  fromDate?: Date;
  toDate?: Date;
  searchValue?: string;
  includeZero?: boolean;
  page?: number;           // new
  parPage?: number;        // new
  sortBy?: string;         // new (e.g., 'accountId' or 'accountName')
  sortOrder?: 'asc' | 'desc'; // new
}


export type BalancesMap = Record<number, AccountBalance>;
