
export enum OrderType {
  CASH = "CASH",
  INSTALLMENT = "INSTALLMENT",
  // Add other payment status types as needed
}

// Define related interfaces
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

export interface Payments {
  id: number;
  voucherNo: number;
  fiscalYear:number;
  receiptTypeId: number;
  currencyId: number;
  currencyType: string;
  accountId: number;
  payer: string;
  payerPhone: string;
  totalAmount: number;
  note: string;
  createdAt: Date;

  account?: Accounts;
}

export interface PaymentState {
  newVoucherNo?: number;
  currencyId: number;
  currencyType: string;
  accountId: number;
  payer: string;
  payerPhone: string;
  totalAmount: number;
  note: string;
  createdAt: Date;
}

export interface PaymentEditState {
  voucherNo: number;
    receiptTypeId:number;
  currencyId: number;
  currencyType: string;
  accountId: number;
  payer: string;
  payerPhone: string;
  totalAmount: number;

  note: string;
  createdAt: Date;

   debtorId: number;
    daneId: number;
    typeId: number;
    type: string;


  account?: Accounts;
}

export interface UpdatePaymentData  {
receiptId?: number | null;
  voucherNo: number;
  currencyId: number;
  currencyType: string;
  accountId: number;
  payer: string;
  payerPhone: string;
  totalAmount: number;
  // discount: number;
  note: string;
  // createdAt: Date;

  debtorId: number;
    daneId: number;
}

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

export type DeletePaymentPayload = {
receiptId?: number;         
  voucherNo?: number;        
  fiscalYear?: number;
  formType: number;  
  deleteReceipt?: Payments;
};

export type GetPaymentTypePayload = {
  voucherNo: number;
  deletedReceipt?: Payments;
};

export 
type DeleteReceiptImageTypePayload = {
  voucherNo: number;
imageName: string;
};

export interface TotalsType {
  totals: {
    amountTaking: number;
    amountPay: number;
  };
}
