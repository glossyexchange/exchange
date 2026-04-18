import { DeleteCancelledIncomeTransferPayload, DeleteIncomeTransferTypePayload, DeletePaidIncomeTransferTypePayload, GetIncomeTransfersParams, IncomeTransfer, IncomeTransferState, PaidIncomeTransfers, PaidIncomeTransferState, UpdateIncomeTransferData } from "@/types/incomeTransferType";
import {
  ApiPagination,
  PaginationState
} from "@/types/sendTransferTypes";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

interface ApiResponse {
  message?: string;
  error?: string;
  incomeTransfers?: IncomeTransfer[];
  cancelledIncomeTransfer?: IncomeTransfer[];
  paidIncomeTransfers?:PaidIncomeTransfers[];
  cancelledIncomeTransfers?:IncomeTransfer[];
  incomeTransfer?: IncomeTransfer | null;
  pagination?: ApiPagination;
  formType?: number;
  transferVoucherNo?: number;
  totalPaidTransfers?:number;
  paidIncomeVoucherNo?:number;
  totalCancelledTransfers?: number;
  transferId?: number;
  typeId?: number;
typeIdIncome?:number;
  Hmula_ID?: number;
  HawalaIncom_ID?: number; 
  type?: string;
  currencyType?: string;
}

interface AuthState {
  successMessage: string;
  errorMessage: string;
  successLastPayMessage: string;
  loader: boolean;
  incomeTransfers: IncomeTransfer[];
  cancelledIncomeTransfer: IncomeTransfer[];
   paidIncomeTransfers:PaidIncomeTransfers[];
   cancelledIncomeTransfers:IncomeTransfer[];
  incomeTransfer: IncomeTransfer | null;
  totalTransfers: number;
   totalPaidTransfers:number;
  totalCancelledTransfers: number;
  pagination: PaginationState;
  transferVoucherNo: number;
   paidIncomeVoucherNo:number;
  transferId: number;
  typeId: number;
typeIdIncome:number;
   Hmula_ID: number;
  HawalaIncom_ID: number; 
  type: string;
  currencyType: string;
}

export const createIncomeTransfer = createAsyncThunk<
  ApiResponse,
  IncomeTransferState,
  { rejectValue: ApiResponse }
>(
  "incomeTransfer/createIncomeTransfer",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post<ApiResponse>(
        "/create/income-transfer",
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


export const updateIncomeTransfer = createAsyncThunk<
  ApiResponse,
  UpdateIncomeTransferData,
  { rejectValue: ApiResponse }
>(
  "incomeTransfer/updateIncomeTransfer",
  async (updateData, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put<ApiResponse>(
        `/update/income-transfer/${updateData.voucherNo}`,
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

export const getIncomeTransfer = createAsyncThunk<
  ApiResponse,
   { transferTypeId?: number; voucherNo?: number; fiscalYear?: number }, // 👈 accept object
  { rejectValue: ApiResponse }
>(
  "incomeTransfer/getIncomeTransfer",
  async (params, { rejectWithValue, fulfillWithValue }) => {
    try {
      const queryParams: Record<string, string> = {};
      if (params.transferTypeId) queryParams.transferTypeId = params.transferTypeId.toString();
      if (params.voucherNo) queryParams.voucherNo = params.voucherNo.toString();
      if (params.fiscalYear)
        queryParams.fiscalYear = params.fiscalYear.toString();

      const queryString = new URLSearchParams(queryParams).toString();
      const { data } = await api.get<ApiResponse>(`/income-transfer?${queryString}`, {
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

  

export const getIncomeTransfers = createAsyncThunk<
  ApiResponse,
  GetIncomeTransfersParams,
  { rejectValue: ApiResponse }
>(
  "incomeTransfer/getIncomeTransfers",
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
        paidId, // Changed from paidType to paidId
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
        ...(paidId !== undefined // Changed condition
          ? { paidId: paidId.toString() }
          : {}),
      };

      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/income-transfers?${queryString}`;

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

export const createPaidTransfer = createAsyncThunk<
  ApiResponse,
  PaidIncomeTransferState,
  { rejectValue: ApiResponse }
>(
  "incomeTransfer/createPaidTransfer",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {

      
      const { data } = await api.post<ApiResponse>(
        "/create/paid-income-transfer",
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

export const getPaidIncomeTransfers = createAsyncThunk<
  ApiResponse,
  GetIncomeTransfersParams,
  { rejectValue: ApiResponse }
>(
  "incomeTransfer/getPaidIncomeTransfers",
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
      const url = `/paid-income-transfers?${queryString}`;

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



export const getCancelledIncomeTransfers = createAsyncThunk<
  ApiResponse,
  GetIncomeTransfersParams,
  { rejectValue: ApiResponse }
>(
  "incomeTransfer/getCancelledIncomeTransfers",
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
      const url = `/cancelled-income-transfers?${queryString}`;

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


export const deleteCancelledIncomeTransfer = createAsyncThunk<
  ApiResponse,
   DeleteCancelledIncomeTransferPayload,
  { rejectValue: ApiResponse }
>(
  "incomeTransfer/deleteCancelledIncomeTransfer",
  async ({ id, voucherNo, fiscalYear, deleteCancelledIncomeTransfer }, { rejectWithValue }) => {
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
        url: `/cancelled-income-transfer?${params.toString()}`,  // DELETE with query params
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

export const deleteIncomeTransfer = createAsyncThunk<
  ApiResponse,
  DeleteIncomeTransferTypePayload,
  { rejectValue: ApiResponse }
>(
  "incomeTransfer/deleteIncomeTransfer",
  async ({ id, voucherNo, fiscalYear, typeId, deleteIncomeTransfer }, { rejectWithValue }) => {
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
        url: `/income-transfer?${params.toString()}`,  // DELETE with query params
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
export const deletePaidIncomeTransferByVoucherNo = createAsyncThunk<
  ApiResponse,
  DeletePaidIncomeTransferTypePayload,
  { rejectValue: ApiResponse }
>(
  "incomeTransfer/deletePaidIncomeTransferByVoucherNo",
  async ({ id, voucherNo, fiscalYear, typeId, deletePaidIncomeTransfer }, { rejectWithValue }) => {
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
        url: `/delete-paid-income-transfer?${params.toString()}`,  // DELETE with query params
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
  incomeTransfers: [],
  cancelledIncomeTransfer: [],
   paidIncomeTransfers:[],
   cancelledIncomeTransfers:[],
  transferVoucherNo: 0,
   paidIncomeVoucherNo:0,
  incomeTransfer: null,
  totalTransfers: 0,
  totalPaidTransfers:0,
  totalCancelledTransfers: 0,
  transferId: 0,
  typeId: 0,
  typeIdIncome:0,
   Hmula_ID:0,
  HawalaIncom_ID:0,
  type:"",
  currencyType:"",
  pagination: {
    totalPage: 0,
    currentPage: 1,
    perPage: 10,
    hasNext: false,
    hasPrev: false,
  },
};

export const incomeTransferReducer = createSlice({
  name: "incomeTransfer",
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
      .addCase(createIncomeTransfer.pending, (state) => {
        state.loader = true;
      })
      .addCase(createIncomeTransfer.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Registration failed";
      })
      .addCase(createIncomeTransfer.fulfilled, (state, action) => {
        const { message,incomeTransfer, transferId, transferVoucherNo } = action.payload;

        return {
          ...state,
          loader: false,
          transferId: transferId || 0,
          incomeTransfer:incomeTransfer || null,
          transferVoucherNo: transferVoucherNo || 0,
          successMessage: message || "Saved Succesfully",
          errorMessage: "",
        };
      })
      .addCase(updateIncomeTransfer.pending, (state) => {
        state.loader = true;
      })
      .addCase(updateIncomeTransfer.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Update failed";
      })
      .addCase(updateIncomeTransfer.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message ?? "Succesfully Updated";
      })

      .addCase(getIncomeTransfer.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.incomeTransfer = payload.incomeTransfer || null;
      })
      .addCase(getIncomeTransfer.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get transfer";
      })

      .addCase(getIncomeTransfers.fulfilled, (state, action) => {
        const { incomeTransfers, pagination } = action.payload;

        return {
          ...state,
          loader: false,
          incomeTransfers: incomeTransfers || [],
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
      .addCase(getIncomeTransfers.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get send transfers";
      })

      .addCase(createPaidTransfer.pending, (state) => {
        state.loader = true;
      })
      .addCase(createPaidTransfer.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Registration failed";
      })
      .addCase(createPaidTransfer.fulfilled, (state, action) => {
        const { message, paidIncomeVoucherNo } = action.payload;

        return {
          ...state,
          loader: false,
          paidIncomeVoucherNo: paidIncomeVoucherNo || 0,
          successMessage: message || "Saved Succesfully",
          errorMessage: "",
        };
      })

      .addCase(getPaidIncomeTransfers.fulfilled, (state, action) => {
        const { paidIncomeTransfers, pagination } = action.payload;

        return {
          ...state,
          loader: false,
          paidIncomeTransfers: paidIncomeTransfers || [],
          totalPaidTransfers: pagination?.total || 0,

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
      .addCase(getPaidIncomeTransfers.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get send transfers";
      })


      .addCase(getCancelledIncomeTransfers.fulfilled, (state, action) => {
        const { cancelledIncomeTransfers, pagination } = action.payload;

        return {
          ...state,
          loader: false,
          cancelledIncomeTransfers: cancelledIncomeTransfers || [],
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
      .addCase(getCancelledIncomeTransfers.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get income transfers";
      })

   .addCase(deleteIncomeTransfer.fulfilled, (state, action) => {
     const { id, voucherNo } = action.meta.arg; // note: fiscalYear isn't needed for filtering
   
     if (id !== undefined) {
       // Remove by id
       state.incomeTransfers = state.incomeTransfers.filter((t) => t.id !== id);
     } else if (voucherNo !== undefined) {
       
       state.incomeTransfers = state.incomeTransfers.filter(
         (t) => t.voucherNo !== voucherNo
       );
       
     }
   
     state.successMessage = action.payload.message || "Deleted successfully";
   })
   .addCase(deleteIncomeTransfer.rejected, (state, action) => {
     
     if (action.meta.arg.deleteIncomeTransfer) {
       state.incomeTransfers.push(action.meta.arg.deleteIncomeTransfer);
     }
     state.errorMessage = action.payload?.error || "Delete failed";
   })
      .addCase(deletePaidIncomeTransferByVoucherNo.fulfilled, (state, action) => {
         const { id, voucherNo } = action.meta.arg; // note: fiscalYear isn't needed for filtering
   
     if (id !== undefined) {
       // Remove by id
       state.paidIncomeTransfers = state.paidIncomeTransfers.filter((t) => t.id !== id);
     } else if (voucherNo !== undefined) {
       
       state.paidIncomeTransfers = state.paidIncomeTransfers.filter(
         (t) => t.voucherNo !== voucherNo
       );
       
     }
   
     state.successMessage = action.payload.message || "Deleted successfully";
      })
      .addCase(deletePaidIncomeTransferByVoucherNo.rejected, (state, action) => {
        if (action.meta.arg.deletePaidIncomeTransfer) {
          state.paidIncomeTransfers.push(action.meta.arg.deletePaidIncomeTransfer);
        }
        state.errorMessage = action.payload?.error || "Delete failed";
      })

      .addCase(deleteCancelledIncomeTransfer.fulfilled, (state, action) => {
        const { id, voucherNo } = action.meta.arg; // note: fiscalYear isn't needed for filtering
      
        if (id !== undefined) {
          // Remove by id
          state.cancelledIncomeTransfers = state.cancelledIncomeTransfers.filter((t) => t.id !== id);
        } else if (voucherNo !== undefined) {
          
          state.cancelledIncomeTransfers = state.cancelledIncomeTransfers.filter(
            (t) => t.voucherNo !== voucherNo
          );
          
        }
      
        state.successMessage = action.payload.message || "Deleted successfully";
      })
      .addCase(deleteCancelledIncomeTransfer.rejected, (state, action) => {
        
        if (action.meta.arg.deleteCancelledIncomeTransfer) {
          state.cancelledIncomeTransfers.push(action.meta.arg.deleteCancelledIncomeTransfer);
        }
        state.errorMessage = action.payload?.error || "Delete failed";
      })
  },
});

export const { messageClear } = incomeTransferReducer.actions;
export default incomeTransferReducer.reducer;
