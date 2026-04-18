import {
  ApiPagination,
  DeletePaymentPayload,
  PaginationParams,
  PaginationState,
  Payments,
  PaymentState,
  UpdatePaymentData,
} from "@/types/paymentType";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

interface PaymentsSum {
  orderVoucherNo: number;
  sum: number;
}

interface ApiResponse {
  message?: string;
  error?: string;
  payments?: Payments[]; // Assuming orders are Accounts
  payment?: Payments | null;
  pagination?: ApiPagination; // Use the full Pagination interface
  paymentsSum?: PaymentsSum;
  paymentId?: number;
  newVoucherNo?: number;
  formType?: number;
}

interface AuthState {
  successMessage: string;
  errorMessage: string;
  loader: boolean;
  payments: Payments[]; // Array of orders
  payment: Payments | null; // Single order detail
  totalPayments: number; // Total count of orders (from pagination.total)
  pagination: PaginationState; // Pagination state without total
  paymentsSum: number;
  paymentId: number;
  newVoucherNo: number;
  remainsMap: Record<number, { balance: number }>;
}

export const createPayment = createAsyncThunk<
  ApiResponse,
  PaymentState,
  { rejectValue: ApiResponse }
>(
  "payment/createPayment",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post<ApiResponse>("/create/payment", info, {
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

export const updatePayment = createAsyncThunk<
  ApiResponse,
  UpdatePaymentData,
  { rejectValue: ApiResponse }
>(
  "payment/updatePayment",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {

      const { voucherNo, ...rest } = info;
      const { data } = await api.put<ApiResponse>(
        `/update/payment/${voucherNo}`,
        rest,
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

export const getAllPayments = createAsyncThunk<
  ApiResponse,
  PaginationParams,
  { rejectValue: ApiResponse }
>(
  "payment/getAllPayments",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const {
        currencyId,
        page,
        parPage,
        searchValue,
        sortBy,
        sortOrder,
        fromDate,
        toDate,
      } = params;

      // Convert dates to ISO strings
      const formatDate = (date?: Date) =>
        date ? date.toISOString() : undefined;

      // Build query parameters
      const queryParams: Record<string, string> = {
        page: page.toString(),
        parPage: parPage.toString(),
        ...(currencyId && currencyId > 0
          ? { currencyId: currencyId.toString() }
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
      const url = `/allPayments?${queryString}`;
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

export const getPayment = createAsyncThunk<
  ApiResponse,
  { paymentId?: number; voucherNo?: number; fiscalYear?: number }, // 👈 accept object
  { rejectValue: ApiResponse }
>(
  "payment/getPayment",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const queryParams: Record<string, string> = {};
      if (params.paymentId) queryParams.paymentId = params.paymentId.toString();
      if (params.voucherNo) queryParams.voucherNo = params.voucherNo.toString();
      if (params.fiscalYear)
        queryParams.fiscalYear = params.fiscalYear.toString();

      const queryString = new URLSearchParams(queryParams).toString();
      const { data } = await api.get<ApiResponse>(`/payment?${queryString}`, {
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


export const deletePayment = createAsyncThunk<
  ApiResponse,
  DeletePaymentPayload,
  { rejectValue: ApiResponse }
>("payment/deletePayment", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.request<ApiResponse>({
      url: `/delete/payment`, // ✅ consider removing voucherNo from URL
      method: "DELETE",
      data: payload, // send full payload in body
      withCredentials: true,
    });
    return data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data || { error: "An error occurred" },
    );
  }
});

const initialState: AuthState = {
  successMessage: "",
  errorMessage: "",
  loader: false,
  payments: [],
  payment: null,
  totalPayments: 0,
  paymentsSum: 0,
  newVoucherNo: 0,
  paymentId: 0,
  remainsMap: {},
  pagination: {
    totalPage: 0,
    currentPage: 1,
    perPage: 10,
    hasNext: false,
    hasPrev: false,
  },
};

export const paymentReducer = createSlice({
  name: "payment",
  initialState,
  reducers: {
    messageClear: (state) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPayment.pending, (state) => {
        state.loader = true;
      })
      .addCase(createPayment.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Registration failed";
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        const { message, newVoucherNo, paymentId } = action.payload;

        return {
          ...state,
          loader: false,
          newVoucherNo: newVoucherNo || 0,
          paymentId: paymentId || 0,
          successMessage: message || "Saved Succesfully",
          errorMessage: "",
        };
      })
      .addCase(updatePayment.pending, (state) => {
        state.loader = true;
      })
      .addCase(updatePayment.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Update failed";
      })
      .addCase(updatePayment.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message ?? "Succesfully Updated";
      })

      .addCase(getPayment.pending, (state) => {
        state.loader = true;
      })
      .addCase(getPayment.fulfilled, (state, action) => {
        state.loader = false;
        state.payment = action.payload.payment || null;
      })
      .addCase(getPayment.rejected, (state, action) => {
        state.loader = false;
        state.errorMessage =
          action.payload?.error || "Failed to fetch payments sum";
      })

      .addCase(getAllPayments.fulfilled, (state, action) => {
        const { payments, pagination } = action.payload;

        return {
          ...state,
          loader: false,
          payments: payments || [],
          totalPayments: pagination?.total || 0,

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
      .addCase(getAllPayments.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get accounts";
      })
     

      .addCase(deletePayment.fulfilled, (state, action) => {
        const deletedPayment = action.meta.arg.deletePayment;

        if (deletedPayment?.id) {
          state.payments = state.payments.filter(
            (p) => p.id !== deletedPayment.id,
          );
        }

        state.successMessage = action.payload.message || "Deleted successfully";
      })
      .addCase(deletePayment.rejected, (state, action) => {
        if (action.meta.arg.deletePayment) {
          state.payments.push(action.meta.arg.deletePayment);
        }

        state.errorMessage = action.payload?.error || "Delete failed";
      });
  },
});

export const { messageClear } = paymentReducer.actions;
export default paymentReducer.reducer;
