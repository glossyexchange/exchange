import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";
import { GetSummaryParams } from "@/types/dashboardRypes";


interface SumData {
  IQD: number;
  USD: number;
}

// interface DashboardData {
//   customerOrders: SumData;
//   carIncomes: SumData;
//   dailyImports: SumData;
//   payments: SumData;
//   receipts: SumData;
//   expenses: SumData;
//   contracts: SumData;
// }

interface DashboardSums {
  total: Record<string, SumData>;
  filtered: Record<string, SumData>;
}

interface ApiResponse {
  message?: string;
  error?: string;
  data?: DashboardSums;
}



interface DashboardState {
  loader: boolean;
  data: DashboardSums | null;
  errorMessage: string;
  successMessage: string;
}




export const getDashboardSums = createAsyncThunk<
  ApiResponse,
  GetSummaryParams,
  // { fromDate?: string; toDate?: string }, // make them optional
  { rejectValue: ApiResponse }
>(
  "dashboard/getDashboardSums",
  async ({ fromDate, toDate }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get<ApiResponse>(
        `/dashboard/data`,
        {
          params: { fromDate, toDate }, // send only if defined
          withCredentials: true,
        }
      );
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" }
      );
    }
  }
);


const initialState: DashboardState  = {
  successMessage: "",
  errorMessage: "",
  loader: false,
  data: null,
 
};

export const dashboardReducer = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    messageClear: (state) => {
      state.successMessage = "";
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardSums.pending, (state) => {
        state.loader = true;
        state.errorMessage = "";
      })
   .addCase(getDashboardSums.fulfilled, (state, action) => {
  const { data, message } = action.payload;
  state.loader = false;

  // assign the API's total/filtered directly
  state.data = data ?? null;

  state.successMessage = message || "";
})
      .addCase(getDashboardSums.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload?.error || "Failed to get dashboard data";
      });
      
  },
});

export const { messageClear } = dashboardReducer.actions;
export default dashboardReducer.reducer;
