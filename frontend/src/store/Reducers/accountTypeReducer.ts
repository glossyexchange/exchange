import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";
import { AccountTypes, CreateInfo, DeleteAccountTypePayload, PaginationParams, UpdateInfo } from "../../types/accountType";
// import Pagination from './../../../../admin/src/views/Pagination';



interface ApiResponse {
  message?: string;
  error?: string;
  accountType?: AccountTypes;
  totalTypes?: number;
  accountTypes?: AccountTypes[];
  pagination?: {
    total: number;
  };
}




interface AuthState {
  successMessage: string;
  errorMessage: string;
  loader: boolean;
 accountTypes: AccountTypes[];
  accountType: AccountTypes | null;
  totalTypes: number;
}

export const createAccountType = createAsyncThunk<
  ApiResponse,
  CreateInfo,
  { rejectValue: ApiResponse }
>(
  "accountType/createAccountType",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {

      const { data } = await api.post<ApiResponse>("/create/account-type", info, {
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

export const updateAccountType = createAsyncThunk<
  ApiResponse,
  UpdateInfo,
  { rejectValue: ApiResponse }
>(
  "accountType/updateAccountType",
  async ({ id, info }, { rejectWithValue, fulfillWithValue }) => {
    try {


      const { data } = await api.put<ApiResponse>(
        `/update/account-type/${id}`,
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

export const deleteAccountType = createAsyncThunk<
  ApiResponse,
  DeleteAccountTypePayload,
  { rejectValue: ApiResponse }
>(
  "accountType/deleteAccountType",
  async ({ id}, { rejectWithValue, fulfillWithValue }) => {
    try {

      const { data } = await api.delete<ApiResponse>(
        `/delete/account-type/${id}`,
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

export const getAllAccountTypes = createAsyncThunk<
  ApiResponse,
  PaginationParams,
  { rejectValue: ApiResponse }
>(
  "accountType/getAllAccountTypes",
  async (
    { parPage, page, searchValue },
    { rejectWithValue, fulfillWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiResponse>(
        `/getAllAccountTypes?page=${page}&searchValue=${searchValue}&parPage=${parPage}`,
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

const initialState: AuthState = {
  successMessage: "",
  errorMessage: "",
  loader: false,
  accountTypes: [],
  accountType: null,
  totalTypes: 0,
};

export const accountTypeReducer = createSlice({
  name: "accountType",
  initialState,
  reducers: {
    messageClear: (state) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAccountType.pending, (state) => {
        state.loader = true;
      })
      .addCase(createAccountType.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Registration failed";
      })
      .addCase(createAccountType.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.accountType = payload.accountType ?? null;
        state.successMessage = payload.message ?? "";
      })
      .addCase(updateAccountType.pending, (state) => {
        state.loader = true;
      })
      .addCase(updateAccountType.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Update failed";
      })
      .addCase(updateAccountType.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message ?? "Succesfully Updated";
      })

      .addCase(deleteAccountType.fulfilled, (state, { payload }) => {
        state.loader = false
         state.successMessage = payload.message ?? "Succesfully deleted";
        state.accountTypes = payload.accountTypes || [];
      })

      .addCase(getAllAccountTypes.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.accountTypes = payload.accountTypes || [];
        state.totalTypes =
          payload.pagination?.total || payload.totalTypes || 0;
      })
      .addCase(getAllAccountTypes.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get accounts";
      });
  },
});

export const { messageClear } = accountTypeReducer.actions;
export default accountTypeReducer.reducer;
