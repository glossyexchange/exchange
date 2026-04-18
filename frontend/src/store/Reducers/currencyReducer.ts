import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

import {
  ApiPagination,
  Currency,
  CurrencyCreateState,
  DeleteCurrencyTypePayload,
  PaginationParams,
  PaginationState,
  UpdateCurrency,
} from "@/types/currencyTypes";

interface ApiResponse {
  message?: string;
  error?: string;
  currencies?: Currency[]; // Assuming orders are Accounts
  currency?: Currency | null;
  pagination?: ApiPagination; // Use the full Pagination interface
}

interface AuthState {
  successMessage: string;
  errorMessage: string;
  loader: boolean;
  currencies: Currency[]; // Array of orders
  currency: Currency | null; // Single order detail
  totalCurrency: number; // Total count of orders (from pagination.total)
  pagination: PaginationState; // Pagination state without total
}

export const createCurrency = createAsyncThunk<
  ApiResponse,
  CurrencyCreateState,
  { rejectValue: ApiResponse }
>(
  "currency/createCurrency",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post<ApiResponse>("/create/currency", info, {
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

export const updateCurrency = createAsyncThunk<
  ApiResponse,
  UpdateCurrency,
  { rejectValue: ApiResponse }
>(
  "currency/updateCurrency",
  async ({ id, info }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put<ApiResponse>(
        `/update/currency/${id}`,
        info,
        {
          withCredentials: true,
        },
      );
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" },
      );
    }
  },
);

export const getAllCurrencies = createAsyncThunk<
  ApiResponse,
  PaginationParams,
  { rejectValue: ApiResponse }
>(
  "currency/getAllCurrencies",
  async (
    { parPage, page, searchValue },
    { rejectWithValue, fulfillWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiResponse>(
        `/currencies?page=${page}&searchValue=${searchValue}&parPage=${parPage}`,
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

export const deleteCurrency = createAsyncThunk<
  ApiResponse,
  DeleteCurrencyTypePayload,
  { rejectValue: ApiResponse }
>("currency/deleteCurrency", async ({ id }, { rejectWithValue }) => {
  // No need for fulfillWithValue
  try {
    const { data } = await api.delete<ApiResponse>(`/delete/currency/${id}`, {
      withCredentials: true,
    });
    return data; // Directly return data
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { error: "An error occurred" },
    );
  }
});

// export const deleteCurrency = createAsyncThunk<
//   ApiResponse,
//   DeleteCurrencyTypePayload,
//   { rejectValue: ApiResponse }
// >(
//   "currency/deleteCurrency",
//   async ({ id}, { rejectWithValue, fulfillWithValue }) => {
//     try {

//       const { data } = await api.delete<ApiResponse>(
//         `/delete/currency/${id}`,
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

const initialState: AuthState = {
  successMessage: "",
  errorMessage: "",
  loader: false,
  currencies: [],
  currency: null,
  totalCurrency: 0,
  pagination: {
    totalPage: 0,
    currentPage: 1,
    perPage: 10,
    hasNext: false,
    hasPrev: false,
  },
};

export const currencyReducer = createSlice({
  name: "currency",
  initialState,
  reducers: {
    messageClear: (state) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCurrency.pending, (state) => {
        state.loader = true;
      })
      .addCase(createCurrency.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Registration failed";
      })
      .addCase(createCurrency.fulfilled, (state, action) => {
        const { message } = action.payload;

        return {
          ...state,
          loader: false,
          //   currencies: currencies || [],
          //   totalCurrency: pagination?.total || 0,

          //   // Store pagination meta without total
          //   pagination: pagination
          //     ? {
          //         totalPage: pagination.totalPage,
          //         currentPage: pagination.currentPage,
          //         perPage: pagination.perPage,
          //         hasNext: pagination.hasNext,
          //         hasPrev: pagination.hasPrev,
          //       }
          //     : state.pagination,

          successMessage: message || "",
          errorMessage: "",
        };
      })
      // .addCase(getAllCurrencies.pending, (state) => {
      //     state.loader = true;
      //   })
      .addCase(getAllCurrencies.fulfilled, (state, action) => {
        const { currencies, pagination} = action.payload;
        state.loader = false;
        state.currencies = currencies || [];
        state.totalCurrency = pagination?.total || 0;

        if (pagination) {
          state.pagination = {
            totalPage: pagination.totalPage,
            currentPage: pagination.currentPage,
            perPage: pagination.perPage,
            hasNext: pagination.hasNext,
            hasPrev: pagination.hasPrev,
          };
        }

        // state.successMessage = message || "";
        // state.errorMessage = "";
      })
      .addCase(getAllCurrencies.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to fetch currencies";
      })
      .addCase(deleteCurrency.fulfilled, (state, action) => {
      const deletedId = action.meta.arg.id; // Correct access point
      // Optimistic removal
      state.currencies = state.currencies.filter(c => c.id !== deletedId);
   
      state.successMessage = action.payload.message || 'Deleted successfully';
    })
    .addCase(deleteCurrency.rejected, (state, action) => {
  // Use optional chaining
  if (action.meta.arg.deletedCurrency) {
    state.currencies = [...state.currencies, action.meta.arg.deletedCurrency];
  }
  state.errorMessage = action.payload?.error || 'Delete failed';
})

      .addCase(updateCurrency.pending, (state) => {
        state.loader = true;
      })
      .addCase(updateCurrency.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Update failed";
      })
      .addCase(updateCurrency.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message ?? "Succesfully Updated";
      });
  },
});

export const { messageClear } = currencyReducer.actions;
export default currencyReducer.reducer;
