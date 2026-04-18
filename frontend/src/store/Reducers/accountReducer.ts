import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/api";

// import axios from 'axios';


interface Account {
  id: string;
  accountId: number;
  name: string;
  phone: string;
  address: string;
  accountTypeId: number;
}
interface PaginationParams {
  parPage: number;
  page: number;
  searchValue: string;
}

interface ApiResponse {
  message?: string;
  error?: string;
  account?: Account;
  totalAccounts?: number;
  accounts?: Account[];
  accountId?:number;
  lastAccountId:number |null
  pagination?: {
    total: number;
  };
  data?: {
    accountId: number; 
    accountType: {
      type: string;
      start: number;
      end: number;
    };
    rangeStart: number;
    rangeEnd: number;
  };
}

interface RegisterInfo {
  accountId: number;
  name: string;
  phone: string;
  address: string;
  accountTypeId: number;
}

interface UpdateInfo {
  name: string;
  phone: string;
  address: string;
  accountTypeId: number;
}

type UpdateAccountPayload = {
  accountId: number;
  info: UpdateInfo;
};

type DeleteAccountPayload = {
  accountId: number;

};

interface SearchParams {
  searchValue: string;
}

interface LastAccountResponse {
  data: {
    accountId: number;
    accountType: string;
    rangeStart: number;
    rangeEnd: number;
  };
  message: string;
}

interface AuthState {
  successMessage: string;
  errorMessage: string;
  loader: boolean;
  accounts: Account[];
  account: Account | null;
  totalAccounts: number;
  lastAccountId:number;
   searchResults: {
    data: Account[];
    loading: boolean;
    error: string | null;
  };
}

export const createAccount = createAsyncThunk<
  ApiResponse,
  RegisterInfo,
  { rejectValue: ApiResponse }
>(
  "account/createAccount",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post<ApiResponse>("/create/account", info, {
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

export const updateAccount = createAsyncThunk<
  ApiResponse,
  UpdateAccountPayload,
  { rejectValue: ApiResponse }
>(
  "account/updateAccount",
  async ({ accountId, info }, { rejectWithValue, fulfillWithValue }) => {
    try {

      const { data } = await api.put<ApiResponse>(
        `/update/account/${accountId}`,
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

export const deleteAccount = createAsyncThunk<
  ApiResponse,
  DeleteAccountPayload,
  { rejectValue: ApiResponse }
>(
  "account/deleteAccount",
  async ({ accountId}, { rejectWithValue, fulfillWithValue }) => {
    try {

      const { data } = await api.delete<ApiResponse>(
        `/delete/account/${accountId}`,
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

export const searchAccounts = createAsyncThunk<
  ApiResponse,
  SearchParams,
  { rejectValue: ApiResponse }
>(
  "account/searchAccounts",
  async (
    { searchValue },
    { rejectWithValue, fulfillWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiResponse>(
        `/allAccounts?searchValue=${encodeURIComponent(searchValue)}&searchMode=autocomplete`,
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

export const getAllAccounts = createAsyncThunk<
  ApiResponse,
  PaginationParams,
  { rejectValue: ApiResponse }
>(
  "account/getAllAccounts",
  async (
    { parPage, page, searchValue },
    { rejectWithValue, fulfillWithValue },
  ) => {
    try {
     
      const { data } = await api.get<ApiResponse>(
        `/allAccounts?page=${page}&searchValue=${searchValue}&parPage=${parPage}`,
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
export const getLastAccountId = createAsyncThunk<
  LastAccountResponse,
  { accountTypeID: number; signal?: AbortSignal },
  { rejectValue: ApiResponse }
>(
  "account/getLastAccountId",
  async ({ accountTypeID, signal }, { rejectWithValue, fulfillWithValue }) => {
    try {
      // Create config object with AxiosRequestConfig type
      //  const config: AxiosRequestConfig  = {
      //   params: { accountTypeID },
      //   withCredentials: true,
      //   signal,
      // };
      const config = {
        params: { accountTypeID },
        withCredentials: true,
        signal
      };
      // Add signal to config if provided
      // if (signal) {
      //   config.signal = signal;
      // }

      const { data } = await api.get<LastAccountResponse>(
        `/lastAccountId`,
        config
      );
      
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { 
          error: "An error occurred",
          message: "Failed to fetch last account ID" 
        }
      );
    }
  }
);


export const getAccountByAccountId = createAsyncThunk<
  ApiResponse,
  { accountId: number },
  { rejectValue: ApiResponse }
>(
  "account/getAccountByAccountId",
  async ({ accountId}, { rejectWithValue, fulfillWithValue }) => {
    try {

      const { data } = await api.get<ApiResponse>(
        `/account/${accountId}`,
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
  loader: false,
  accounts: [],
  account: null,
  totalAccounts: 0,
  lastAccountId:0,
  searchResults: {
    data: [],
    loading: false,
    error: null,
  },
};

export const accountReducer = createSlice({
  name: "account",
  initialState,
  reducers: {
    messageClear: (state) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
     clearSearchResults: (state) => {
      state.searchResults.data = [];
      state.searchResults.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAccount.pending, (state) => {
        state.loader = true;
      })
      .addCase(createAccount.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Registration failed";
      })
      .addCase(createAccount.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.account = payload.account ?? null;
        state.successMessage = payload.message ?? "";
      })
      .addCase(updateAccount.pending, (state) => {
        state.loader = true;
      })
      .addCase(updateAccount.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Update failed";
      })
      .addCase(updateAccount.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message ?? "Succesfully Updated";
      })

      .addCase(deleteAccount.fulfilled, (state, { payload }) => {
        state.loader = false
         state.successMessage = payload.message ?? "Succesfully deleted";
        state.accounts = payload.accounts || [];
      })

      .addCase(getAllAccounts.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.accounts = payload.accounts || [];
        state.totalAccounts =
          payload.pagination?.total || payload.totalAccounts || 0;
      })
      .addCase(getAllAccounts.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get accounts";
      })
      builder
      .addCase(searchAccounts.pending, (state) => {
        state.searchResults.loading = true;
        state.searchResults.error = null;
      })
      .addCase(searchAccounts.fulfilled, (state, action: PayloadAction<ApiResponse>) => {
        state.searchResults.loading = false;
        state.searchResults.data = action.payload.accounts || [];
      })
      .addCase(searchAccounts.rejected, (state, action) => {
        state.searchResults.loading = false;
        state.searchResults.error = action.payload?.error || "Search failed";
      })
      .addCase(getLastAccountId.pending, (state) => {
        // state.loader = true;
        state.errorMessage =""
      })
      .addCase(getLastAccountId.fulfilled, (state, { payload }) => {
  // state.loader = false;

  
  if (payload.data && typeof payload.data.accountId === 'number') {
    state.lastAccountId = payload.data.accountId;
    console.log("Set lastAccountId:", payload.data.accountId);
  } else {
    console.error("accountId missing in payload data");
    state.lastAccountId = 0; // Default value
  }
})
.addCase(getLastAccountId.rejected, (state, { payload }) => {
  // state.loader = false;
  state.errorMessage = payload?.error || 'Unknown error';
  state.lastAccountId = 0; // Reset on error
})

 .addCase(getAccountByAccountId.fulfilled, (state, { payload }) => {
        state.loader=false;
        state.account=payload.account || null
      })
    .addCase(getAccountByAccountId.rejected, (state, { payload }) => {
      state.loader = false;
      state.errorMessage = payload?.error || "Failed to get accounts";
    })
  },
});

export const { messageClear, clearSearchResults } = accountReducer.actions;
export default accountReducer.reducer;
