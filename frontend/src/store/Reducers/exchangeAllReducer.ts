import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

import {
  ApiPagination,
  DeleteExchangeAllTypePayload,
  ExchangeAll,
  ExchangeAllState,
  GetExchangeAllParams,
  PaginationState,
  UpdateExchangeAllData,
} from "@/types/exchangeAllTypes";

interface ApiResponse {
  message?: string;
  error?: string;
  exchangeAllCurrencies?: ExchangeAll[];
  exchangeAll?: ExchangeAll | null;
  totalExchangeAll?: number;
  pagination?: ApiPagination;
  typeId?: number;
  allVoucherNo?: number;
  exchangeAllId?: number;
}

interface AuthState {
  successMessage: string;
  errorMessage: string;
  successLastPayMessage: string;
  loader: boolean;
  exchangeAllCurrencies: ExchangeAll[];
  exchangeAll: ExchangeAll | null;
  allVoucherNo: number;
  exchangeAllId: number;
  totalExchangeAll: number;
  pagination: PaginationState;
}

export const createExchangeAll = createAsyncThunk<
  ApiResponse,
  ExchangeAllState,
  { rejectValue: ApiResponse }
>(
  "exchangeAll/createExchangeAll",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post<ApiResponse>(
        "/create/echange-all",
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

export const updateExchangeAll = createAsyncThunk<
  ApiResponse,
  UpdateExchangeAllData,
  { rejectValue: ApiResponse }
>(
  "exchangeAll/updateExchangeAll",
  async (updateData, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put<ApiResponse>(
        `/update/exchange-all/${updateData.voucherNo}`,
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

export const getAllExchanges = createAsyncThunk<
  ApiResponse,
  GetExchangeAllParams,
  { rejectValue: ApiResponse }
>(
  "exchangeAll/getAllExchanges",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const {
        accountId,
        page,
        parPage,
        searchValue,
        exchangeTypeId,
        currencyId,
        sortBy,
        sortOrder,
        fromDate,
        toDate,
      } = params;

      const formatDate = (date?: Date) =>
        date ? date.toISOString() : undefined;

      const queryParams: Record<string, string> = {
        page: page.toString(),
        parPage: parPage.toString(),
        ...(accountId && accountId > 0
          ? { accountId: accountId.toString() }
          : {}),
        ...(currencyId && currencyId > 0
          ? { currencyId: currencyId.toString() }
          : {}),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(fromDate && { fromDate: formatDate(fromDate) }),
        ...(toDate && { toDate: formatDate(toDate) }),
        ...(searchValue && { searchValue }),
        ...(exchangeTypeId && exchangeTypeId > 0
          ? { exchangeTypeId: exchangeTypeId.toString() }
          : {}),
      };

      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/all-exchange-currencies?${queryString}`;

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

export const deleteExchangeAll = createAsyncThunk<
  ApiResponse,
  DeleteExchangeAllTypePayload,
  { rejectValue: ApiResponse }
>(
  "exchangeAll/deleteExchangeAll",
  async (
    { id, voucherNo, fiscalYear, typeId, deleteExchangeAll },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (id !== undefined) {
        params.append("id", id.toString());
      } else if (voucherNo !== undefined && fiscalYear !== undefined) {
        params.append("voucherNo", voucherNo.toString());
        params.append("fiscalYear", fiscalYear.toString());
      } else {
        throw new Error(
          "Either 'id' or both 'voucherNo' and 'fiscalYear' must be provided.",
        );
      }

      const { data } = await api.request<ApiResponse>({
        url: `/delete-exchange-all?${params.toString()}`,
        method: "DELETE",
        withCredentials: true,
      });

      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" },
      );
    }
  },
);

export const getExchangeAllByVoucherNo = createAsyncThunk<
  ApiResponse,
  { id?: number; voucherNo?: number; fiscalYear?: number },
  { rejectValue: ApiResponse }
>(
  "exchangeAll/getExchangeAllByVoucherNo",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    // Remove destructuring
    try {
      const queryParams: Record<string, string> = {};
      if (params.id) queryParams.id = params.id.toString();
      if (params.voucherNo) queryParams.voucherNo = params.voucherNo.toString();
      if (params.fiscalYear)
        queryParams.fiscalYear = params.fiscalYear.toString();

      const queryString = new URLSearchParams(queryParams).toString();
      const { data } = await api.get<ApiResponse>(
        `/exchange-currencies?${queryString}`,
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

const initialState: AuthState = {
  successMessage: "",
  errorMessage: "",
  successLastPayMessage: "",
  loader: false,
  exchangeAllCurrencies: [],
  exchangeAll: null,
  allVoucherNo: 0,
  exchangeAllId: 0,
  totalExchangeAll: 0,
  pagination: {
    totalPage: 0,
    currentPage: 1,
    perPage: 10,
    hasNext: false,
    hasPrev: false,
  },
};

export const exchangeAllReducer = createSlice({
  name: "exchangeAll",
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
      .addCase(createExchangeAll.pending, (state) => {
        state.loader = true;
      })
      .addCase(createExchangeAll.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Registration failed";
      })
      .addCase(createExchangeAll.fulfilled, (state, action) => {
        const { message, allVoucherNo, exchangeAll, exchangeAllId } = action.payload;

        return {
          ...state,
          loader: false,
          allVoucherNo: allVoucherNo || 0,
          exchangeAllId: exchangeAllId || 0,
          exchangeAll: exchangeAll || null,
          successMessage: message || "Saved Successfully",
          errorMessage: "",
        };
      })
      .addCase(updateExchangeAll.pending, (state) => {
        state.loader = true;
      })
      .addCase(updateExchangeAll.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Update failed";
      })
      .addCase(updateExchangeAll.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message ?? "Succesfully Updated";
      })

      .addCase(deleteExchangeAll.fulfilled, (state, action) => {
        const { id, voucherNo } = action.meta.arg; // note: fiscalYear isn't needed for filtering

        if (id !== undefined) {
          // Remove by id
          state.exchangeAllCurrencies = state.exchangeAllCurrencies.filter(
            (t) => t.id !== id,
          );
        } else if (voucherNo !== undefined) {
          state.exchangeAllCurrencies = state.exchangeAllCurrencies.filter(
            (t) => t.voucherNo !== voucherNo,
          );
        }

        state.successMessage = action.payload.message || "Deleted successfully";
      })
      .addCase(deleteExchangeAll.rejected, (state, action) => {
        // Use optional chaining
        if (action.meta.arg.deleteExchangeAll) {
          state.exchangeAllCurrencies.push(action.meta.arg.deleteExchangeAll);
        }
        state.errorMessage = action.payload?.error || "Delete failed";
      })

      .addCase(getAllExchanges.fulfilled, (state, action) => {
        const { exchangeAllCurrencies, pagination } = action.payload;

        return {
          ...state,
          loader: false,
          exchangeAllCurrencies: exchangeAllCurrencies || [],
          totalExchangeAll: pagination?.total || 0,

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
      .addCase(getAllExchanges.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage =
          payload?.error || "Failed to get exchange all currencies";
      })

      .addCase(getExchangeAllByVoucherNo.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.exchangeAll = payload.exchangeAll || null;
      })
      .addCase(getExchangeAllByVoucherNo.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get exchange all";
      });
  },
});

export const { messageClear } = exchangeAllReducer.actions;
export default exchangeAllReducer.reducer;
