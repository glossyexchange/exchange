import { Admin } from "./exchangeAllTypes";

// Define related interfaces
export interface Accounts {
   id: number;
  accountId: number,
  name: string;
  phone: string;
  address: string;
  accountTypeId: number;
}



export interface Account {
  accountId: number,
  name: string;
  phone: string;
  address: string;
}

export interface ReceiverAddress {
   id?: number;
  companyName: string;
  personName: string;
  address: string;
  phone:string;

}

export interface Currency {
  currencyId: number;
 currency:string;
}

export interface PaginationParams {
  parPage: number;
  page: number;
  searchValue: string;
  status:string;
  orderTypeId?: number;
}



export interface IncomeTransfer {
  id: number;
  voucherNo: number;
  
  fiscalYear:number;
    currencyId: number;
  ComSender_ID: number;
  HmulafromComSender: number;
  HmulatoComSender: number;
   RecieverPerson: string;
  RecieverAddress: string;
  RecieverPhone: string;
  SenderPerson: string;
  SenderAddress: string;
  SenderPhone: string;
  AmountTransfer: number;
  HmulafromReceiver:number;
  TotalTransferToReceiver: number;
  Notes: string;
  createdAt: Date;
  USER_ID: number;
paidId:number;
  sender?: Accounts;
   currency?: Currency;
 }

 export interface PaidIncomeTransfers {
   id:number;
    voucherNo: number;
    incomeVoucherNo: number;
     fiscalYear:number;
   currencyId: number;
  ComSender_ID: number;
  HmulafromComSender: number;
    HmulatoComSender: number;
  
  RecieverPerson: string;
  RecieverAddress: string;
  RecieverPhone: string;
  SenderPerson: string;
  SenderAddress: string;
  SenderPhone: string;
  AmountTransfer: number;
 HmulafromReceiver:number;
  TotalTransferToReceiver: number;
  Notes: string;
  createdAt: Date;
  USER_ID: number;
  paidDate:Date;
         sender?: Accounts;
         account?:Accounts;
   currency?: Currency;
   paidTransferAddress?:ReceiverAddress;
   admin?:Admin;
}

export interface IncomeTransferState {
   id?:number;
   currencyId: number;
  ComSender_ID: number;
  HmulafromComSender: number;
    HmulatoComSender: number;
  
  RecieverPerson: string;
  RecieverAddress: string;
  RecieverPhone: string;
  SenderPerson: string;
  SenderAddress: string;
  SenderPhone: string;
  AmountTransfer: number;
 HmulafromReceiver:number;
  TotalTransferToReceiver: number;
  Notes: string;
  createdAt: Date;
  USER_ID: number;
 
}

export interface PaidIncomeTransferState {
   id?:number;
   currencyId: number;
  ComSender_ID: number;
  HmulafromComSender: number;
    HmulatoComSender: number;
  
  RecieverPerson: string;
  RecieverAddress: string;
  RecieverPhone: string;
  SenderPerson: string;
  SenderAddress: string;
  SenderPhone: string;
  AmountTransfer: number;
 HmulafromReceiver:number;
  TotalTransferToReceiver: number;
  Notes: string;
  createdAt: Date;
  USER_ID: number;
  paidDate:Date;
        paidTransferAddressId: number;
        companyName: string;
        personName: string;
        address: string;
        phone: string;
}

export type UpdateIncomeTransferData = IncomeTransferState & {
  id: number;
  voucherNo: number;
  currencyType: string;
  typeId: number;
  type: string;
  Hmula_ID: number;
HawalaIncom_ID:number;
};



export interface IncomeTransferListState {
   currencyId: number;
  currencyName: string;
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



export interface GetIncomeTransfersParams {
  page: number;
  parPage: number;
  searchValue?: string;
  currencyId?:number;
  sortBy?: "createdAt" | "amountUsd" | "voucherNo";
  sortOrder?: "asc" | "desc";
  fromDate?: Date | null;
  toDate?: Date | null;
  paidId?: number;
}

export type DeleteIncomeTransferTypePayload = {
   id?: number;
  voucherNo: number;
   typeId: number;
   fiscalYear?: number;
  deleteIncomeTransfer?: IncomeTransfer;
};

export type DeletePaidIncomeTransferTypePayload = {
   id?: number;
  voucherNo: number;
   fiscalYear?: number;
  typeId: number;

  deletePaidIncomeTransfer?: PaidIncomeTransfers;
};

export type DeleteCancelledIncomeTransferPayload = {
   id?: number;
  voucherNo?: number;
  fiscalYear?: number;
    deleteCancelledIncomeTransfer?: IncomeTransfer;
};


