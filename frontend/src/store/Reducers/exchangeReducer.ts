import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

import { ApiPagination, DeleteExchangeUSdTypePayload, ExchangeUSD, ExchangeUSDState, GetExchangeUsdParams, PaginationState, UpdateExchangeUSDData } from "@/types/exchangeUsdType";
interface ApiResponse {
  message?: string;
  error?: string;
  exchangeUsds?: ExchangeUSD[];
  exchangeUsd?: ExchangeUSD | null;
  carNames?: string[];
  totalExchangeUSD?: number;
  pagination?: ApiPagination;
 typeId?:number;
 UsdVoucherNo?:number;
 exchangeId?:number;
}

interface AuthState {
  successMessage: string;
  errorMessage: string;
  successLastPayMessage: string;
  loader: boolean;
  exchangeUsds: ExchangeUSD[]; 
  exchangeUsd: ExchangeUSD | null; 
  UsdVoucherNo:number;
  exchangeId:number;
  carNames: string[];
  totalExchangeUSD: number; 
  pagination: PaginationState; 
}

export const createExchangeUsd = createAsyncThunk<
  ApiResponse,
  ExchangeUSDState, 
  { rejectValue: ApiResponse }
>(
  "exchange/createExchangeUsd",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      
      const { data } = await api.post<ApiResponse>("/create/exchange-usd", info, {
        withCredentials: true,
      });

      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" },
      );
    }
  },
);

export const updateExchangeUsd = createAsyncThunk<
  ApiResponse,
  UpdateExchangeUSDData,
  { rejectValue: ApiResponse }
>(
  "carImport/updateExchangeUsd",
  async (updateData, { rejectWithValue, fulfillWithValue }) => {
    try {
      
      const { data } = await api.put<ApiResponse>(
        `/update/exchange-usd/${updateData.voucherNo}`,
        updateData,
        { withCredentials: true },
      );
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" },
      );
    }
  },
);


export const getAllUsdExchanges = createAsyncThunk<
  ApiResponse,
  GetExchangeUsdParams,
  { rejectValue: ApiResponse }
>(
  "exchange/getAllUsdExchanges",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const {accountId, page, parPage, searchValue, exchangeTypeId, sortBy, sortOrder, fromDate, toDate } = params;

      const formatDate = (date?: Date) => date ? date.toISOString() : undefined;

      const queryParams: Record<string, string> = {
  page: page.toString(),
  parPage: parPage.toString(),
   ...(accountId && accountId > 0 ? { accountId: accountId.toString() } : {}),
  ...(sortBy && { sortBy }),
  ...(sortOrder && { sortOrder }),
  ...(fromDate && { fromDate: formatDate(fromDate) }),
  ...(toDate && { toDate: formatDate(toDate) }),
  ...(searchValue && { searchValue }),
  ...(exchangeTypeId && exchangeTypeId > 0 ? { exchangeTypeId: exchangeTypeId.toString() } : {}),
};

      Object.keys(queryParams).forEach(key => queryParams[key] === undefined && delete queryParams[key]);

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/all-exchange-usd?${queryString}`;
      
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

export const getExchangeUSDByVoucherNo = createAsyncThunk<
  ApiResponse,
   { id?: number; voucherNo?: number; fiscalYear?: number }, // 👈 accept object
  { rejectValue: ApiResponse }
>(
  "exchange/getExchangeUSDByVoucherNo",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const queryParams: Record<string, string> = {};
      if (params.id) queryParams.id = params.id.toString();
      if (params.voucherNo) queryParams.voucherNo = params.voucherNo.toString();
      if (params.fiscalYear)
        queryParams.fiscalYear = params.fiscalYear.toString();

      const queryString = new URLSearchParams(queryParams).toString();
      const { data } = await api.get<ApiResponse>(`/exchange-usd?${queryString}`, {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" },
      );
    }
  },
);


export const deleteExchangeUsd = createAsyncThunk<
  ApiResponse,
  DeleteExchangeUSdTypePayload,
  { rejectValue: ApiResponse }
>(
  "exchange/deleteExchangeUsd",
 async ({ id, voucherNo, fiscalYear, typeId, deleteExchangeUsd }, { rejectWithValue }) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (id !== undefined) {
        params.append("id", id.toString());
      } else if (voucherNo !== undefined && fiscalYear !== undefined) {
        params.append("voucherNo", voucherNo.toString());
        params.append("fiscalYear", fiscalYear.toString());
      } else {
        throw new Error("Either 'id' or both 'voucherNo' and 'fiscalYear' must be provided.");
      }

      const { data } = await api.request<ApiResponse>({
        url: `/exchange-usd?${params.toString()}`, 
        method: "DELETE",
        withCredentials: true,

      });

      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" },
      );
    }
  }
);

// export const getExchangeUSDByVoucherNo = createAsyncThunk<
//   ApiResponse,
//   number, // Change from ExchangeUsdByVoucherTypePayload to number
//   { rejectValue: ApiResponse }
// >(
//   "exchange/getExchangeUSDByVoucherNo",
//   async (voucherNo, { rejectWithValue, fulfillWithValue }) => { // Remove destructuring
//     try {
//       const { data } = await api.get<ApiResponse>(`/exchange-usd/${voucherNo}`, {
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

const initialState: AuthState = {
  successMessage: "",
  errorMessage: "",
  successLastPayMessage: "",
  loader: false,
  exchangeUsds: [],
  exchangeUsd: null,
  carNames: [],
  UsdVoucherNo:0,
  exchangeId:0,
  totalExchangeUSD: 0,
  pagination: {
    totalPage: 0,
    currentPage: 1,
    perPage: 10,
    hasNext: false,
    hasPrev: false,
  },
};

export const carImportReducer = createSlice({
  name: "carImport",
  initialState,
  reducers: {
    messageClear: (state) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
    messageLastPayClear: (state) => {
      state.successLastPayMessage = "";
      // state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createExchangeUsd.pending, (state) => {
        state.loader = true;
      })
      .addCase(createExchangeUsd.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Create exchange Usd failed";
      })
      .addCase(createExchangeUsd.fulfilled, (state, action) => {
        const { message, UsdVoucherNo,exchangeId } = action.payload;

  return {
    ...state,
    loader: false,
    UsdVoucherNo: UsdVoucherNo || 0, 
    exchangeId: exchangeId || 0,
    successMessage: message || "Saved Successfully",
    errorMessage: "",
  };
      })
      .addCase(updateExchangeUsd.pending, (state) => {
        state.loader = true;
      })
      .addCase(updateExchangeUsd.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Update failed";
      })
      .addCase(updateExchangeUsd.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message ?? "Succesfully Updated";
      })

   .addCase(deleteExchangeUsd.fulfilled, (state, action) => {
           const { id, voucherNo } = action.meta.arg; // note: fiscalYear isn't needed for filtering

  if (id !== undefined) {
    // Remove by id
    state.exchangeUsds = state.exchangeUsds.filter((t) => t.id !== id);
  } else if (voucherNo !== undefined) {
    
    state.exchangeUsds = state.exchangeUsds.filter(
      (t) => t.voucherNo !== voucherNo
    );
    
  }

  state.successMessage = action.payload.message || "Deleted successfully";
         })
         .addCase(deleteExchangeUsd.rejected, (state, action) => {
           if (action.meta.arg.deleteExchangeUsd) {
    state.exchangeUsds.push(action.meta.arg.deleteExchangeUsd);
  }
  state.errorMessage = action.payload?.error || "Delete failed";
         })
      

      .addCase(getAllUsdExchanges.fulfilled, (state, action) => {
        const { exchangeUsds, pagination } = action.payload;

        return {
          ...state,
          loader: false,
          exchangeUsds: exchangeUsds || [],
          totalExchangeUSD: pagination?.total || 0,



          // Store pagination meta without total
          pagination: pagination
            ? {
                totalPage: pagination.totalPage,
                currentPage: pagination.currentPage,
                perPage: pagination.perPage,
                hasNext: pagination.hasNext,
                hasPrev: pagination.hasPrev,
              }
            : state.pagination,

          // successMessage: message || "Saved Succesfully",
          // errorMessage: "",
        };
      })
      .addCase(getAllUsdExchanges.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get exchange Usd";
      })

      

      .addCase(getExchangeUSDByVoucherNo.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.exchangeUsd = payload.exchangeUsd || null;
      })
      .addCase(getExchangeUSDByVoucherNo.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get exchange Usd";
      });
  },
});

export const { messageClear } = carImportReducer.actions;
export default carImportReducer.reducer;
