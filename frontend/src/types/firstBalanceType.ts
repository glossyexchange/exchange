import { User } from "./adminTypes";
import { Currency } from "./currencyTypes";

// Define related interfaces
export interface Accounts {
  id: number;
  accountId: number;
  name: string;
  phone: string;
  address: string;
  accountTypeId: number;
}



export interface PaginationParams {
  currencyId?: number;
  page: number;
  parPage: number;
  searchValue?: string;
  sortBy?: 'createdAt' | 'totalAmount' | 'voucherNo';
  sortOrder?: 'asc' | 'desc';
  fromDate?: Date | null;
  toDate?: Date | null;
}

export interface FirstBalance {
  id: number;
  voucherNo: number;
  fiscalYear: number;
  currencyId: number;
     balanceTypeId: number;
  balanceType:string;
 createdAt: Date;
  accountId: number;
   balance: string;
  note: string;
 USER_ID: number;
 typeId: number;
 type: string;

  account?: Accounts;
  admin: User;
  currency: Currency;
}

export interface FirstBalanceState {
   voucherNo?: number;
newVoucherNo?:number;
 fiscalYear: number;
  currencyId: number;
     balanceTypeId: number | null;
  balanceType:string;
 createdAt: Date;
  accountId: number;
   balance: number;
  note: string;
 USER_ID: number;
 typeId?: number;
 type?: string;
}

export interface FirstBalanceEditState {
  voucherNo?: number;
  fiscalYear: number;
  currencyId: number;
     balanceTypeId: number | null;
  balanceType:string;
 createdAt: Date;
  accountId: number;
   balance: number;
  note: string;
 USER_ID: number;
    typeId?: number;
    type?: string;

}

export interface FirstBalanceQueryParams {
  page: number;
  parPage: number;
  searchValue?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  currencyId?: number;
  fiscalYear?: number;          // additional filter
  accountId?: number;           // additional filter
  balanceTypeId?: number;       // additional filter (1 or 2)
  fromDate?: Date;
  toDate?: Date;
}

// export interface UpdatePayment {
//   voucherNo: number;
//   info: PaymentState;
// }

export interface SumPayments {
  orderVoucherNo: number;
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

export type DeleteFirstBalancePayload = {
 fiscalYear: number;
  voucherNo: number;
  typeId: number;
  originalRecord?: FirstBalance;
};

export interface TotalsType {
  totals: {
    amountTaking: number;
    amountPay: number;
  };
}
