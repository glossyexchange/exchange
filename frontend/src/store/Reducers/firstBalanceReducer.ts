import { DeleteFirstBalancePayload, FirstBalance, FirstBalanceEditState, FirstBalanceQueryParams, FirstBalanceState } from "@/types/firstBalanceType";
import {
  ApiPagination,
  PaginationState
} from "@/types/paymentType";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

interface FirstBalanceSum {
  voucherNo: number;
  sum: number;
}

interface ApiResponse {
  message?: string;
  error?: string;
  firstBalances?: FirstBalance[]; 
  firstBalance?: FirstBalance | null;
  pagination?: ApiPagination; 
  balanceSum?: FirstBalanceSum;
  newVoucherNo?:number;
  formType?:number;
  totalFirstBalances?: number;
}

interface AuthState {
  successMessage: string;
  errorMessage: string;
  loader: boolean;
  firstBalances: FirstBalance[]; 
  firstBalance: FirstBalance | null;
  pagination: PaginationState; 
  balanceSum: number;
  newVoucherNo:number;
  totalFirstBalances: number;
  remainsMap: Record<number, { balance: number }>;
}

export const createFirstBalance = createAsyncThunk<
  ApiResponse,
  FirstBalanceState, 
  { rejectValue: ApiResponse }
>(
  "firstBalance/createFirstBalance",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {

      const { data } = await api.post<ApiResponse>("/create/balance", info, {
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

export const updateFirstBalance = createAsyncThunk<
  ApiResponse,
  FirstBalanceEditState,
  { rejectValue: ApiResponse }
>(
  "firstBalance/updateFirstBalance",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      // Send PUT request with the composite key and updatable fields
      const { data } = await api.put<ApiResponse>("/update/balance", info, {
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


export const getFirstBalances = createAsyncThunk<
  ApiResponse,
  FirstBalanceQueryParams,
  { rejectValue: ApiResponse }
>(
  "firstBalance/getFirstBalances",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const {
        currencyId,
        fiscalYear,
        accountId,
        balanceTypeId,
        page,
        parPage,
        searchValue,
        sortBy,
        sortOrder,
        fromDate,
        toDate,
      } = params;

      // Helper to format dates as ISO strings
      const formatDate = (date?: Date) =>
        date ? date.toISOString() : undefined;

      // Build query parameters
      const queryParams: Record<string, string> = {
        page: page.toString(),
        parPage: parPage.toString(),
        ...(currencyId && currencyId > 0
          ? { currencyId: currencyId.toString() }
          : {}),
        ...(fiscalYear && fiscalYear > 0
          ? { fiscalYear: fiscalYear.toString() }
          : {}),
        ...(accountId && accountId > 0
          ? { accountId: accountId.toString() }
          : {}),
        ...(balanceTypeId && (balanceTypeId === 1 || balanceTypeId === 2)
          ? { balanceTypeId: balanceTypeId.toString() }
          : {}),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(fromDate && { fromDate: formatDate(fromDate) }),
        ...(toDate && { toDate: formatDate(toDate) }),
        ...(searchValue && { searchValue }),
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/allFirstBalances?${queryString}`; // adjust endpoint as needed
      const { data } = await api.get<ApiResponse>(url, {
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


export const deleteFirstBalance = createAsyncThunk<
  ApiResponse,
  DeleteFirstBalancePayload,
  { rejectValue: ApiResponse }
>("firstBalance/deleteFirstBalance", async (payload, { rejectWithValue }) => {
  try {
    const { fiscalYear, voucherNo, typeId } = payload;
    const { data } = await api.delete<ApiResponse>(
      `/delete/firstBalance/${fiscalYear}/${voucherNo}/${typeId}`,
      { withCredentials: true }
    );
    return data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { error: "An error occurred" }
    );
  }
});




const initialState: AuthState = {
  successMessage: "",
  errorMessage: "",
  loader: false,
  firstBalances: [],
  firstBalance: null,
  totalFirstBalances: 0,
  balanceSum: 0,
   newVoucherNo:0,
  remainsMap: {},
  pagination: {
    totalPage: 0,
    currentPage: 1,
    perPage: 10,
    hasNext: false,
    hasPrev: false,
  },
};

export const firstBalanceReducer = createSlice({
  name: "firstBalance",
  initialState,
  reducers: {
    messageClear: (state) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createFirstBalance.pending, (state) => {
        state.loader = true;
      })
      .addCase(createFirstBalance.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Registration failed";
      })
      .addCase(createFirstBalance.fulfilled, (state, action) => {
        const { message, newVoucherNo } = action.payload;

        return {
          ...state,
          loader: false,
          newVoucherNo: newVoucherNo || 0,
          successMessage: message || "Saved Succesfully",
          errorMessage: "",
        };
      })

       .addCase(updateFirstBalance.pending, (state) => {
              state.loader = true;
            })
            .addCase(updateFirstBalance.rejected, (state, { payload }) => {
              state.loader = false;
              state.errorMessage = payload?.error || "Update failed";
            })
            .addCase(updateFirstBalance.fulfilled, (state, { payload }) => {
              state.loader = false;
              state.successMessage = payload.message ?? "Succesfully Updated";
            })

      .addCase(getFirstBalances.fulfilled, (state, action) => {
              const { firstBalances, pagination } = action.payload;
      
              return {
                ...state,
                loader: false,
                firstBalances: firstBalances || [],
                totalFirstBalances: pagination?.total || 0,
      
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
            .addCase(getFirstBalances.rejected, (state, { payload }) => {
              state.loader = false;
              state.errorMessage = payload?.error || "Failed to get accounts";
            })
      
.addCase(deleteFirstBalance.pending, (state, action) => {
 state.loader = true;
  const { fiscalYear, voucherNo, typeId } = action.meta.arg;
  state.firstBalances = state.firstBalances.filter(
    item => !(item.fiscalYear === fiscalYear && item.voucherNo === voucherNo && item.typeId === typeId)
  );
})
.addCase(deleteFirstBalance.fulfilled, (state, action) => {
  state.loader = false;
  state.successMessage = action.payload.message || "Deleted successfully";
})
.addCase(deleteFirstBalance.rejected, (state, action) => {
  state.loader = false;
  if (action.meta.arg.originalRecord) {
    // Insert at the original index (you'd need to store index in meta)
    // Or just push and then re-sort if your list is normally sorted.
    state.firstBalances.push(action.meta.arg.originalRecord);
    // If your list is sorted by voucherNo, re-sort:
    state.firstBalances.sort((a, b) => a.voucherNo - b.voucherNo);
  }
  state.errorMessage = action.payload?.error || "Delete failed";
});
  },
});

export const { messageClear } = firstBalanceReducer.actions;
export default firstBalanceReducer.reducer;
