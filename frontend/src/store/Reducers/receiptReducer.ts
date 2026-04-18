import {
  ApiPagination,
  DeletePaymentPayload,
  PaginationParams,
  PaginationState,
  Payments,
  PaymentState,
  UpdatePaymentData
} from "@/types/receiptType";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

interface PaymentsSum {
  orderVoucherNo: number;
  sum: number;
}

interface PaymentsSumMap {
  [voucherNo: number]: number; // voucherNo -> sum
}

interface ApiResponse {
  message?: string;
  error?: string;
  receipts?: Payments[]; // Assuming orders are Accounts
  receipt?: Payments | null;
  pagination?: ApiPagination; // Use the full Pagination interface
  paymentsSum?: PaymentsSum;
  receiptId?: number;
  paymentsAllSum?: PaymentsSumMap;
  newVoucherNo?:number;
  formType?:number;
}

interface AuthState {
  successMessage: string;
  errorMessage: string;
  loader: boolean;
  receipts: Payments[]; // Array of orders
  receipt: Payments | null; // Single order detail
  totalPayments: number; // Total count of orders (from pagination.total)
  pagination: PaginationState; // Pagination state without total
  paymentsSum: number;
    receiptId: number;
  newVoucherNo:number;
    paymentsAllSum: PaymentsSumMap;
  remainsMap: Record<number, { balance: number }>;
}


export const createReceipt = createAsyncThunk<
  ApiResponse,
  PaymentState, 
  { rejectValue: ApiResponse }
>(
  "receipt/createReceipt",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {

      const { data } = await api.post<ApiResponse>("/create/receipt", info, {
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


export const updateReceipt = createAsyncThunk<
  ApiResponse,
UpdatePaymentData,
  { rejectValue: ApiResponse }
>(
  "receipt/updateReceipt",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { voucherNo, ...rest } = info;
      const { data } = await api.put<ApiResponse>(
        `/update/receipt/${voucherNo}`,
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

export const getAllReceipts = createAsyncThunk<
   ApiResponse,
  PaginationParams,
  { rejectValue: ApiResponse }
>(
  "receipt/getAllReceipts",
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
      const url = `/receipts?${queryString}`;
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

export const getReceipt = createAsyncThunk<
  ApiResponse,
  { paymentId?: number; voucherNo?: number; fiscalYear?: number }, // 👈 accept object
  { rejectValue: ApiResponse }
>(
  "receipt/getReceipt",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const queryParams: Record<string, string> = {};
      if (params.paymentId) queryParams.paymentId = params.paymentId.toString();
      if (params.voucherNo) queryParams.voucherNo = params.voucherNo.toString();
      if (params.fiscalYear)
        queryParams.fiscalYear = params.fiscalYear.toString();

      const queryString = new URLSearchParams(queryParams).toString();
      const { data } = await api.get<ApiResponse>(`/receipt?${queryString}`, {
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

export const deleteReceipt = createAsyncThunk<
  ApiResponse,
  DeletePaymentPayload,
  { rejectValue: ApiResponse }
>("receipt/deleteReceipt", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.request<ApiResponse>({
      url: `/delete/receipt`, // ✅ consider removing voucherNo from URL
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
  receipts: [],
  receipt: null,
  totalPayments: 0,
  paymentsSum: 0,
   newVoucherNo:0,
     receiptId: 0,
  remainsMap: {},
  paymentsAllSum: {},
  pagination: {
    totalPage: 0,
    currentPage: 1,
    perPage: 10,
    hasNext: false,
    hasPrev: false,
  },
};

export const receiptReducer = createSlice({
  name: "receipt",
  initialState,
  reducers: {
    messageClear: (state) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReceipt.pending, (state) => {
        state.loader = true;
      })
      .addCase(createReceipt.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Registration failed";
      })
      .addCase(createReceipt.fulfilled, (state, action) => {
        const { message, newVoucherNo, receiptId } = action.payload;

        return {
          ...state,
          loader: false,
          newVoucherNo: newVoucherNo || 0,
           receiptId: receiptId || 0,
          successMessage: message || "Saved Succesfully",
          errorMessage: "",
        };
      })
      .addCase(updateReceipt.pending, (state) => {
        state.loader = true;
      })
      .addCase(updateReceipt.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Update failed";
      })
      .addCase(updateReceipt.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message ?? "Succesfully Updated";
      })

      

       .addCase(getReceipt.pending, (state) => {
        state.loader = true;
      })
      .addCase(getReceipt.fulfilled, (state, action) => {
        state.loader = false;
       state.receipt = action.payload.receipt || null;
      })
      .addCase(getReceipt.rejected, (state, action) => {
        state.loader = false;
        state.errorMessage = action.payload?.error || 'undefined';
      })

      

      .addCase(getAllReceipts.fulfilled, (state, action) => {
        const { receipts, pagination } = action.payload;

        return {
          ...state,
          loader: false,
          receipts: receipts || [],
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
      .addCase(getAllReceipts.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get accounts";
      })
      

      .addCase(deleteReceipt.fulfilled, (state, action) => {
        const deletedPayment = action.meta.arg.deleteReceipt;

        if (deletedPayment?.id) {
          state.receipts = state.receipts.filter(
            (p) => p.id !== deletedPayment.id,
          );
        }

        state.successMessage = action.payload.message || "Deleted successfully";
      })
      .addCase(deleteReceipt.rejected, (state, action) => {
        if (action.meta.arg.deleteReceipt) {
          state.receipts.push(action.meta.arg.deleteReceipt);
        }

        state.errorMessage = action.payload?.error || "Delete failed";
      });
  },
});

export const { messageClear } = receiptReducer.actions;
export default receiptReducer.reducer;
