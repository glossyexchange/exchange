
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



export interface Qaid {
  id: number;
  voucherNo: number;
  fiscalYear:number;
    currencyId: number;
  ComSender_ID: number;
   ComeReciever_ID: number;
    AmountTransfer: number;
   Notes: string;
  createdAt: Date;
  USER_ID: number;

  sender?: Accounts;
   receiver?: Accounts;
  currency?: Currency;

}


  

export interface QaidState {
   id?:number;
   currencyId: number;
  ComSender_ID: number;
   ComeReciever_ID: number;
  
  AmountTransfer: number;
 
  Notes: string;
  createdAt: Date;
  USER_ID: number;

}

export type UpdateSendTransferData = QaidState & {
  id: number;
  voucherNo: number;
  currencyType: string;
  typeId: number;
  type: string;

};



export interface SendTransferListState {
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

export type OrderByVoucherTypePayload = {
  voucherNo: number;
order?: Qaid;
};

export interface GetSendTransfersParams {
  page: number;
  parPage: number;
  searchValue?: string;
  currencyId?:number;
  sortBy?: "createdAt" | "AmountTransfer" | "voucherNo";
  sortOrder?: "asc" | "desc";
  fromDate?: Date | null;
  toDate?: Date | null;
}

export type DeleteQaidPayload = {
   id?: number;
  voucherNo?: number;
  fiscalYear?: number;
  typeId:number;
    deleteQaid?: Qaid;
};



