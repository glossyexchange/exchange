import {
  ApiPagination,

  CancelledSendTransfer,

  DeleteCancelledSendTransferPayload,

  DeleteSendTransferPayload,

  GetSendTransfersParams,
  PaginationState,
  SendTransfer,
  SendTransferState,
  UpdateSendTransferData,
} from "@/types/sendTransferTypes";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

interface ApiResponse {
  message?: string;
  error?: string;
  sendTransfers?: SendTransfer[];
  cancelledSendTransfer?: CancelledSendTransfer[];
  sendTransfer?: SendTransfer | null;
  pagination?: ApiPagination;
  formType?: number;
  typeReceiptId?: number;
  transferVoucherNo?: number;
  totalCancelledTransfers?: number;
  transferId?: number;
  typeId?: number;
}

interface AuthState {
  successMessage: string;
  errorMessage: string;
  successLastPayMessage: string;
  loader: boolean;
  sendTransfers: SendTransfer[];
  cancelledSendTransfer: CancelledSendTransfer[];
  sendTransfer: SendTransfer | null;
  totalTransfers: number;
  totalCancelledTransfers: number;
  pagination: PaginationState;
  transferVoucherNo: number;
  transferId: number;
  typeId: number;
}

export const createTransfer = createAsyncThunk<
  ApiResponse,
  SendTransferState,
  { rejectValue: ApiResponse }
>(
  "sendTransfer/createTransfer",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post<ApiResponse>(
        "/create/send-transfer",
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

export const updateSendTransfer = createAsyncThunk<
  ApiResponse,
  UpdateSendTransferData,
  { rejectValue: ApiResponse }
>(
  "sendTransfer/updateSendTransfer",
  async (updateData, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put<ApiResponse>(
        `/update/send-transfer/${updateData.voucherNo}`,
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

export const getSendTransfer = createAsyncThunk<
  ApiResponse,
   { transferTypeId?: number; voucherNo?: number; fiscalYear?: number }, // 👈 accept object
  { rejectValue: ApiResponse }
>(
  "sendTransfer/getSendTransfer",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const queryParams: Record<string, string> = {};
      if (params.transferTypeId) queryParams.transferTypeId = params.transferTypeId.toString();
      if (params.voucherNo) queryParams.voucherNo = params.voucherNo.toString();
      if (params.fiscalYear)
        queryParams.fiscalYear = params.fiscalYear.toString();

      const queryString = new URLSearchParams(queryParams).toString();
      const { data } = await api.get<ApiResponse>(`/send-transfer?${queryString}`, {
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

  
export const getSendTransfers = createAsyncThunk<
  ApiResponse,
  GetSendTransfersParams,
  { rejectValue: ApiResponse }
>(
  "sendTransfer/getSendTransfers",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const {
        page,
        parPage,
        searchValue,
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

        ...(currencyId && currencyId > 0
          ? { currencyId: currencyId.toString() }
          : {}),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(fromDate && { fromDate: formatDate(fromDate) }),
        ...(toDate && { toDate: formatDate(toDate) }),
        ...(searchValue && { searchValue }),
      };

      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/send-transfers?${queryString}`;


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

export const getCancelledSendTransfers = createAsyncThunk<
  ApiResponse,
  GetSendTransfersParams,
  { rejectValue: ApiResponse }
>(
  "sendTransfer/getCancelledSendTransfers",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const {
        page,
        parPage,
        searchValue,
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

        ...(currencyId && currencyId > 0
          ? { currencyId: currencyId.toString() }
          : {}),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(fromDate && { fromDate: formatDate(fromDate) }),
        ...(toDate && { toDate: formatDate(toDate) }),
        ...(searchValue && { searchValue }),
      };

      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/cancelled-send-transfers?${queryString}`;


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


export const deleteSendTransfer = createAsyncThunk<
  ApiResponse,
  DeleteSendTransferPayload,
  { rejectValue: ApiResponse }
>(
  "sendTransfer/deleteSendTransfer",
  async ({ id, voucherNo, fiscalYear, typeId, deleteSendTransfer }, { rejectWithValue }) => {
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
        url: `/send-transfer?${params.toString()}`,  // DELETE with query params
        method: "DELETE",
        withCredentials: true,
        // No request body needed
      });

      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" },
      );
    }
  }
);

export const deleteCancelledSendTransfer = createAsyncThunk<
  ApiResponse,
   DeleteCancelledSendTransferPayload,
  { rejectValue: ApiResponse }
>(
  "sendTransfer/deleteCancelledSendTransfer",
  async ({ id, voucherNo, fiscalYear, deleteCancelledSendTransfer }, { rejectWithValue }) => {
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
        url: `/cancelled-send-transfer?${params.toString()}`,  // DELETE with query params
        method: "DELETE",
        withCredentials: true,
        // No request body needed
      });

      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" },
      );
    }
  }
);
const initialState: AuthState = {
  successMessage: "",
  errorMessage: "",
  successLastPayMessage: "",
  loader: false,
  sendTransfers: [],
  cancelledSendTransfer: [],
  transferVoucherNo: 0,
  sendTransfer: null,
  totalTransfers: 0,
  totalCancelledTransfers: 0,
  transferId: 0,
  typeId: 0,
  pagination: {
    totalPage: 0,
    currentPage: 1,
    perPage: 10,
    hasNext: false,
    hasPrev: false,
  },
};

export const sendTransferReducer = createSlice({
  name: "sendTransfer",
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
      .addCase(createTransfer.pending, (state) => {
        state.loader = true;
      })
      .addCase(createTransfer.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Registration failed";
      })
      .addCase(createTransfer.fulfilled, (state, action) => {
        const { message, transferId, transferVoucherNo } = action.payload;

        return {
          ...state,
          loader: false,
          transferId: transferId || 0,
          transferVoucherNo: transferVoucherNo || 0,
          successMessage: message || "Saved Succesfully",
          errorMessage: "",
        };
      })
      .addCase(updateSendTransfer.pending, (state) => {
        state.loader = true;
      })
      .addCase(updateSendTransfer.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Update failed";
      })
      .addCase(updateSendTransfer.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message ?? "Succesfully Updated";
      })

      .addCase(getSendTransfer.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.sendTransfer = payload.sendTransfer || null;
      })
      .addCase(getSendTransfer.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get transfer";
      })

      .addCase(getSendTransfers.fulfilled, (state, action) => {
        const { sendTransfers, pagination } = action.payload;

        return {
          ...state,
          loader: false,
          sendTransfers: sendTransfers || [],
          totalTransfers: pagination?.total || 0,

          pagination: pagination
            ? {
                totalPage: pagination.totalPage,
                currentPage: pagination.currentPage,
                perPage: pagination.perPage,
                hasNext: pagination.hasNext,
                hasPrev: pagination.hasPrev,
              }
            : state.pagination,
        };
      })
      .addCase(getSendTransfers.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get send transfers";
      })

      .addCase(getCancelledSendTransfers.fulfilled, (state, action) => {
        const { cancelledSendTransfer, pagination } = action.payload;

        return {
          ...state,
          loader: false,
          cancelledSendTransfer: cancelledSendTransfer || [],
          totalCancelledTransfers: pagination?.total || 0,

          pagination: pagination
            ? {
                totalPage: pagination.totalPage,
                currentPage: pagination.currentPage,
                perPage: pagination.perPage,
                hasNext: pagination.hasNext,
                hasPrev: pagination.hasPrev,
              }
            : state.pagination,
        };
      })
      .addCase(getCancelledSendTransfers.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get send transfers";
      })

      .addCase(deleteSendTransfer.fulfilled, (state, action) => {
  const { id, voucherNo } = action.meta.arg; // note: fiscalYear isn't needed for filtering

  if (id !== undefined) {
    // Remove by id
    state.sendTransfers = state.sendTransfers.filter((t) => t.id !== id);
  } else if (voucherNo !== undefined) {
    
    state.sendTransfers = state.sendTransfers.filter(
      (t) => t.voucherNo !== voucherNo
    );
    
  }

  state.successMessage = action.payload.message || "Deleted successfully";
})
.addCase(deleteSendTransfer.rejected, (state, action) => {
  
  if (action.meta.arg.deleteSendTransfer) {
    state.sendTransfers.push(action.meta.arg.deleteSendTransfer);
  }
  state.errorMessage = action.payload?.error || "Delete failed";
})


.addCase(deleteCancelledSendTransfer.fulfilled, (state, action) => {
  const { id, voucherNo } = action.meta.arg; // note: fiscalYear isn't needed for filtering

  if (id !== undefined) {
    // Remove by id
    state.cancelledSendTransfer = state.cancelledSendTransfer.filter((t) => t.id !== id);
  } else if (voucherNo !== undefined) {
    
    state.cancelledSendTransfer = state.cancelledSendTransfer.filter(
      (t) => t.voucherNo !== voucherNo
    );
    
  }

  state.successMessage = action.payload.message || "Deleted successfully";
})
.addCase(deleteCancelledSendTransfer.rejected, (state, action) => {
  
  if (action.meta.arg.deleteCancelledSendTransfer) {
    state.cancelledSendTransfer.push(action.meta.arg.deleteCancelledSendTransfer);
  }
  state.errorMessage = action.payload?.error || "Delete failed";
})

      
  },
});

export const { messageClear } = sendTransferReducer.actions;
export default sendTransferReducer.reducer;
