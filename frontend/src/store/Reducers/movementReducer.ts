import { BalanceAccount, BalancesMap, GeneralBalanceParams, GeneralBalanceResponse, GetAccountBalanceParams, GetMovementsParams, Movements, PaginationState } from "@/types/movementType";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";


// interface ApiResponse {
//   message?: string;
//   error?: string;
//   data?: { 
//     movements?: Movements[]; 
//     movement?: Movements | null;
//     pagination?: ApiPagination;
//     totals?: {
//       amountTaking: number;
//       amountPay: number;
//     };
//     currentPeriod: {
//       amountTaking: number;
//       amountPay: number;
//       balance: number;
//       status: string;
//       currency: string;
//     },
//   };
// }

interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  data?: T;
  totals?: { 
    amountTaking: number;
    amountPay: number;
    openingAmountTaking:number;
      openingAmountPay:number;
      balanceBefore:number;
       movementAmountTaking:number;
      movementAmountPay:number;
  };
}


interface AuthState {
  successMessage: string;
  errorMessage: string;
  loader: boolean;
  movements: Movements[]; 
  movement: Movements | null;
  totalMovements: number; 
  totals?: { 
    amountTaking: number;
    amountPay: number;
     openingAmountTaking:number;
      openingAmountPay:number;
      balanceBefore:number;
      movementAmountTaking:number;
      movementAmountPay:number;
  };
  pagination: PaginationState; 
  currentPeriod: {
    amountTaking: number;
    amountPay: number;
    balance: number;
    status: string;
    currency: string;
  } | null;
    balancesMap: Record<number, { balance: number; currency: string }>;
    generalBalances: BalanceAccount[],
}

// export const createMovement = createAsyncThunk<
//   ApiResponse,
//  MovementState,
//   { rejectValue: ApiResponse }
// >(
//   "movement/createMovement",
//   async (info, { rejectWithValue, fulfillWithValue }) => {
//     try {
      
//       const { data } = await api.post<ApiResponse>("/create/movement", info, {
//         withCredentials: true,
//       });

//       return fulfillWithValue(data);
//     } catch (error: any) {
//       return rejectWithValue(
//         error.response?.data || { error: "An error occurred" },
//       );
//     }
//   },
// );

// export const updateMovement = createAsyncThunk<
//   ApiResponse,
//   UpdateMovement,
//   { rejectValue: ApiResponse }
// >(
//   "movement/updateMovement",
//   async ({ voucherNo, info }, { rejectWithValue, fulfillWithValue }) => {
//     try {
//       const { data } = await api.put<ApiResponse>(
//         `/movements/${voucherNo}`,
//         info,
//         {
//           withCredentials: true,
//         },
//       );
//       return fulfillWithValue(data);
//     } catch (error: any) {
//       return rejectWithValue(
//         error.response?.data || { error: "An error occurred" },
//       );
//     }
//   },
// );


// export const getMovementsByAccount = createAsyncThunk<
//   ApiResponse,
//   GetMovementsParams,
//   { rejectValue: ApiResponse }
// >(
//   "movement/getMovementsByAccount",
//   async (params, { rejectWithValue, fulfillWithValue }) => {
//     try {
//       const { currencyId, accountId, page, parPage, searchValue, sortBy, sortOrder, fromDate, toDate } = params;


//       // Convert dates to ISO strings
//       const formatDate = (date?: Date) => date ? date.toISOString() : undefined;
      
//       // Build query parameters
//       const queryParams: Record<string, string> = {
//   page: page.toString(),
//   parPage: parPage.toString(),
//   ...(currencyId && currencyId > 0 ? { currencyId: currencyId.toString() } : {}),
//   ...(accountId && accountId > 0 ? { accountId: accountId.toString() } : {}),
//   ...(sortBy && { sortBy }),
//   ...(sortOrder && { sortOrder }),
//   ...(fromDate && { fromDate: formatDate(fromDate) }),
//   ...(toDate && { toDate: formatDate(toDate) }),
//   ...(searchValue && { searchValue }),
// };

//       // Remove undefined values
//       Object.keys(queryParams).forEach(key => queryParams[key] === undefined && delete queryParams[key]);

//       const queryString = new URLSearchParams(queryParams).toString();
//       const url = `/movements?${queryString}`;
      
//       const { data } = await api.get<ApiResponse>(url, { 
//         withCredentials: true 
//       });
      
//       return fulfillWithValue(data);
//     } catch (error: any) {
//       return rejectWithValue(
//         error.response?.data || { error: "An error occurred" },
//       );
//     }
//   },
// );

export const getMovementsByAccount = createAsyncThunk<
  ApiResponse,
  GetMovementsParams,
  { rejectValue: ApiResponse }
>(
  "movement/getMovementsByAccount",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { currencyId, accountId, fiscalYear, page, parPage, searchValue, sortBy, sortOrder, fromDate, toDate } = params;
 
      const formatDateForQuery = (date?: Date) => {
        if (!date) return undefined;
        return date.toISOString();
      };

      const queryParams: Record<string, string> = {
        page: page.toString(),
        parPage: parPage.toString(),
        ...(currencyId && currencyId > 0 ? { currencyId: currencyId.toString() } : {}),
        ...(accountId && accountId > 0 ? { accountId: accountId.toString() } : {}),
        ...(fiscalYear ? { fiscalYear: fiscalYear.toString() } : {}), // ← ADD THIS LINE
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(fromDate && { fromDate: formatDateForQuery(fromDate) }),
        ...(toDate && { toDate: formatDateForQuery(toDate) }),
        ...(searchValue && { searchValue }),
      };

      // Remove undefined values (optional, but you can keep)
      Object.keys(queryParams).forEach(key => queryParams[key] === undefined && delete queryParams[key]);

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/movements?${queryString}`;
      
      const { data } = await api.get<ApiResponse>(url, { 
        withCredentials: true 
      });
      
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" },
      );
    }
  },
);

export const getAccountBalance = createAsyncThunk<
  ApiResponse<BalancesMap>, // returns a map of balances keyed by accountId
  GetAccountBalanceParams,
  { rejectValue: ApiResponse }
>(
  "movement/getAccountBalance",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { accountIds, currencyId, fromDate, toDate } = params;

      const formatDate = (date?: Date) => (date ? date.toISOString() : undefined);

      const queryParams: Record<string, string> = {
        ...(currencyId ? { currencyId: currencyId.toString() } : {}),
        ...(fromDate ? { fromDate: formatDate(fromDate) } : {}),
        ...(toDate ? { toDate: formatDate(toDate) } : {}),
        accountIds: accountIds.join(","), // send multiple account IDs
      };

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/accounts/balances?${queryString}`;

      const { data } = await api.get<ApiResponse<BalancesMap>>(url, {
        withCredentials: true,
      });

      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" }
      );
    }
  }
);

export const getGeneralBalance = createAsyncThunk<
  GeneralBalanceResponse,
  GeneralBalanceParams,
  { rejectValue: GeneralBalanceResponse }
>(
  "movement/getGeneralBalance",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const {
        currencyId,
        fiscalYear,
        fromDate,
        toDate,
        searchValue,
        includeZero,
        page = 1,
        parPage = 10,
        sortBy = 'accountName',
        sortOrder = 'asc',
      } = params;

      const formatDate = (date?: Date) => (date ? date.toISOString() : undefined);

      const queryParams: Record<string, string> = {
        currencyId: currencyId.toString(),
        page: page.toString(),
        parPage: parPage.toString(),
        sortBy,
        sortOrder,
      };

      if (fiscalYear) queryParams.fiscalYear = fiscalYear.toString();
      if (fromDate) queryParams.fromDate = formatDate(fromDate)!;
      if (toDate) queryParams.toDate = formatDate(toDate)!;
      if (searchValue) queryParams.searchValue = searchValue;
      if (includeZero) queryParams.includeZero = 'true';

      // Remove undefined values (already handled)
      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/general-balance?${queryString}`;

      const { data } = await api.get<GeneralBalanceResponse>(url, {
        withCredentials: true,
      });

      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { data: [], message: "An error occurred" }
      );
    }
  }
);




const initialState: AuthState = {
  successMessage: "",
  errorMessage: "",
  loader: false,
  movements: [],
  movement: null,
  totals: { 
    amountTaking: 0,
    amountPay: 0,
     openingAmountTaking:0,
      openingAmountPay:0,
      balanceBefore:0,
      movementAmountTaking:0,
      movementAmountPay:0,
  },
  totalMovements: 0,
  pagination: {
    total: 0,
    totalPage: 0,
    currentPage: 1,
    perPage: 10,
    hasNext: false,
    hasPrev: false,
  },
  currentPeriod: null,
  generalBalances:[],
  balancesMap: {},
};

export const movementReducer = createSlice({
  name: "movement",
  initialState,
  reducers: {
    messageClear: (state) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
        resetMovements: (state) => {
      state.movements = [];
      state.totals = undefined;
      state.pagination = {
        total: 0,
        totalPage: 0,
        currentPage: 1,
        perPage: 10,
        hasNext: false,
        hasPrev: false,
      };
      state.balancesMap = {};
    },

  },

  extraReducers: (builder) => {
    builder
      // .addCase(createMovement.pending, (state) => {
      //   state.loader = true;
      // })
      // .addCase(createMovement.rejected, (state, { payload }) => {
      //   state.loader = false;
      //   state.errorMessage = payload?.error || "Account Statement failed";
      // })
      // .addCase(createMovement.fulfilled, (state, action) => {
      //   const { message } = action.payload;

      //   return {
      //     ...state,
      //     loader: false,
     
      //     successMessage: message || "Saved Succesfully",
      //     errorMessage: "",
      //   };
      // })

      // .addCase(updateMovement.pending, (state) => {
      //            state.loader = true;
      //          })
      //          .addCase(updateMovement.rejected, (state, { payload }) => {
      //            state.loader = false;
      //            state.errorMessage = payload?.error || "Update failed";
      //          })
      //          .addCase(updateMovement.fulfilled, (state, { payload }) => {
      //            state.loader = false;
      //            state.successMessage = payload.message ?? "Succesfully Updated";
      //          })
   

   .addCase(getMovementsByAccount.fulfilled, (state, action) => {
    // Access the data property from the response
    const responseData = action.payload.data;
    
    if (!responseData) {
        return {
            ...state,
            loader: false,
            errorMessage: "Invalid response from server"
        };
    }

    const movements = responseData.movements || [];
    const totals = responseData.totals;
    const backendPagination = responseData.pagination;

    // Map backend pagination to frontend pagination state
    const frontendPagination: PaginationState = backendPagination 
        ? {
          total:backendPagination.total,
            totalPage: backendPagination.totalPage,
            currentPage: backendPagination.currentPage,
            perPage: backendPagination.perPage,
            hasNext: backendPagination.hasNext,
            hasPrev: backendPagination.hasPrev,
        }
        : state.pagination;

    return {
        ...state,
        loader: false,
        movements: movements,
        totalMovements: backendPagination?.total || 0,
        totals: totals, // Store amountTaking/amountPay totals
        pagination: frontendPagination,
        successMessage: action.payload.message || "Movements retrieved successfully",
        errorMessage: "",
    };
})

.addCase(getAccountBalance.fulfilled, (state, action) => {
  const balances = action.payload.data;

  if (!balances) {
    state.loader = false;
    state.errorMessage = "Invalid response from server";
    return;
  }

  // Merge new balances into existing map
  state.balancesMap = {
    ...state.balancesMap,
    ...balances,
  };

  state.loader = false;
  state.successMessage =
    action.payload.message || "Balances retrieved successfully";
  state.errorMessage = "";
})
.addCase(getGeneralBalance.fulfilled, (state, action) => {
  const { data, pagination } = action.payload;
  state.loader = false;
  state.generalBalances = data || [];
  if (pagination) {
    state.pagination = {
      total: pagination.total,
      totalPage: pagination.totalPages,
      currentPage: pagination.currentPage,
      perPage: pagination.perPage,
      hasNext: pagination.hasNext,
      hasPrev: pagination.hasPrev,
    };
  }
  state.errorMessage = '';
})
.addCase(getGeneralBalance.rejected, (state, action) => {
  state.loader = false;
  state.errorMessage = action.payload?.message || 'Failed to fetch balances';
});
   
  },
});

export const { messageClear , resetMovements} = movementReducer.actions;
export default movementReducer.reducer;
