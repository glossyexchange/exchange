

// Define related interfaces
export interface Currency {
   id: number;
  currencyId: number;
  currencySymbol: string;
  currency: string;
CurrencyPrice: number;
currencyAction:string;
}



export interface PaginationParams {
  parPage: number;
  page: number;
  searchValue: string;
}


export type DeleteCurrencyTypePayload = {
  id: number;
deletedCurrency?: Currency;
};


export interface CurrencyMovementState {
   currencyId: number;
  currency: string;
 

}

export interface CurrencyCreateState {
   currencyId: number;
  currencySymbol: string;
  currency: string;
  CurrencyPrice?: number;
  currencyAction:string;

}

export interface UpdateCurrency{
    id: number;
 info: CurrencyCreateState;
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