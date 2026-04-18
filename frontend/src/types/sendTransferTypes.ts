
// Define related interfaces
export interface Accounts {
   id: number;
  accountId: number,
  name: string;
  phone: string;
  address: string;
  accountTypeId: number;
}

export interface Address {
   id: number;
  country: string;
  city: string;
  place: string;
  address: string;
  phone:string;

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



export interface SendTransfer {
  id: number;
  voucherNo: number;
  fiscalYear:number;
    currencyId: number;
  ComSender_ID: number;
  HmulafromComSender: number;
  ComeReciever_ID: number;
  HmulafromComReciever: number;
  HmulatoComReciever: number;
  RecieverPerson: string;
  RecieverAddress: string;
  RecieverPhone: string;
  SenderPerson: string;
  SenderAddress: string;
  SenderPhone: string;
  AmountTransfer: number;
  HmulatoComSender: number;
  TotalTransferToReceiver: number;
  Notes: string;
  createdAt: Date;
  USER_ID: number;
 transferTypeId: number;

  sender?: Accounts;
   receiver?: Accounts;
  currency?: Currency;
  address?: Address;
}


  export interface CancelledSendTransfer {
  id: number;
  voucherNo: number;
  fiscalYear:number;
    currencyId: number;
  comSenderId: number;
  hmulaFromComSender: number;
  comReceiverId: number;
  HmulafromComReciever: number;
  HmulatoComReciever: number;
  receiverPerson: string;
  receiverAddress: string;
  recieverPhone: string;
  senderPerson: string;
  senderAddress: string;
  senderPhone: string;
  amountTransfer: number;
  hmulaToComSender: number;
  totalTransferToReceiver: number;
  Notes: string;
  createdAt: Date;
  userId: number;
 transferTypeId: number;
addressId:number;

  sender?: Accounts;
   receiver?: Accounts;
  currency?: Currency;
  address?: Address;
}


export interface SendTransferState {
   id?:number;
   currencyId: number;
  ComSender_ID: number;
  HmulafromComSender: number;
  ComeReciever_ID: number;
  HmulafromComReciever: number;
  HmulatoComReciever: number;
  RecieverPerson: string;
  RecieverAddress: string;
  RecieverPhone: string;
  SenderPerson: string;
  SenderAddress: string;
  SenderPhone: string;
  AmountTransfer: number;
  HmulatoComSender: number;
  TotalTransferToReceiver: number;
  Notes: string;
  createdAt: Date;
  USER_ID: number;
  transferTypeId: number;
}

export type UpdateSendTransferData = SendTransferState & {
  id: number;
  voucherNo: number;
  currencyType: string;
  typeId: number;
  type: string;
  Hmula_ID: number;

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
order?: SendTransfer;
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

export type DeleteSendTransferPayload = {
   id?: number;
  voucherNo?: number;
  fiscalYear?: number;
  typeId:number;
    deleteSendTransfer?: SendTransfer;
};



export type DeleteCancelledSendTransferPayload = {
   id?: number;
  voucherNo?: number;
  fiscalYear?: number;
    deleteCancelledSendTransfer?: CancelledSendTransfer;
};

