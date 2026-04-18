import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/api'
import { jwtDecode } from 'jwt-decode'
import { User, LoginInfo,  PaginationParams, PaginationState,  DeleteAdminTypePayload, UpdatePassword } from '@/types/adminTypes'

// Define TypeScript interfaces

interface ApiResponse {
  message?: string;
  error?: string;
  token?: string;
  admin?: User;
  admins?: User[];
  totalAdmins?: number;
  
  userInfo?: User;
  pagination?: PaginationState; 
  
}

interface AuthState {
  successMessage: string;
  errorMessage: string;
  loader: boolean;
  adminUsers: User[];
  totalAdmins: number;
  adminUser: User | null;
  userInfo: User | null;
  role: string;
  token: string | null;
  pagination: PaginationState; 
}



// Define a type for the decoded JWT token
interface DecodedToken {
  exp: number;
  role: string;
  // Add other properties if needed
}

// Helper function with TypeScript return type
const returnRole = (token: string | null): string => {
  if (token) {
    const decodeToken = jwtDecode<DecodedToken>(token);
    const expireTime = new Date(decodeToken.exp * 1000);
    if (new Date() > expireTime) {
      localStorage.removeItem('accessToken');
      return '';
    } else {
      return decodeToken.role;
    }
  }
  return '';
};

// Async thunks with TypeScript types
export const admin_login = createAsyncThunk<
  ApiResponse,
  LoginInfo,
  { rejectValue: ApiResponse }
>(
  'auth/admin_login',
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {

     
      const { data } = await api.post<ApiResponse>('/admin-login', info, {
        withCredentials: true,
      });
      if (data.token) {
        localStorage.setItem('accessToken', data.token);
      }
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { error: 'An error occurred' });
    }
  }
);

export const createAdmin = createAsyncThunk<
  ApiResponse,
  FormData,
  { rejectValue: ApiResponse }
>(
  'auth/createAdmin',
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post<ApiResponse>('/admin/create', info, {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { error: 'An error occurred' });
    }
  }
);

export const getAllAdmins = createAsyncThunk<
  ApiResponse,
  PaginationParams,
  { rejectValue: ApiResponse }
>(
  'auth/getAllAdmins',
  async ({ parPage, page, searchValue }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get<ApiResponse>(
        `/admins?page=${page}&searchValue=${searchValue}&parPage=${parPage}`,
        { withCredentials: true }
      );
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { error: 'An error occurred' });
    }
  }
);

export const deleteAdmin = createAsyncThunk<
  ApiResponse,
  DeleteAdminTypePayload,
  { rejectValue: ApiResponse }
>(
  "auth/deleteAdmin",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const { data } = await api.request<ApiResponse>({
        url: `/delete/admin/${userId}`,
        method: "DELETE",
        // data: { formType }, // ✅ sent in body
        withCredentials: true,
      });
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: "An error occurred" }
      );
    }
  }
);



export const updateAdmin = createAsyncThunk<
  ApiResponse,
  { userId: number; formData: FormData },
  { rejectValue: ApiResponse }
>(
  'auth/updateAdmin',
  async ({userId,formData}, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put<ApiResponse>(`/update-admin/${userId}`, formData, {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { error: 'An error occurred' });
    }
  }
);

export const updateAdminPassword = createAsyncThunk<
  ApiResponse,
  UpdatePassword,
  { rejectValue: ApiResponse }
>(
  'auth/updateAdminPassword',
  async ({ userId, password, newPassword }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put<ApiResponse>(
        `/admins/update-password/${userId}`,  // match backend route
        { password, newPassword },            // backend expects both
        { withCredentials: true }
      );
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { error: 'An error occurred' }
      );
    }
  }
);
// export const admin_image_upload = createAsyncThunk<
//   ApiResponse,
//   ImageUploadInfo,
//   { rejectValue: ApiResponse }
// >(
//   'auth/admin_image_upload',
//   async ({ userId, image }, { rejectWithValue, fulfillWithValue }) => {
//     try {
//       const formData = new FormData();
//       formData.append('image', image);
//       formData.append('userId', userId);

//       const { data } = await api.post<ApiResponse>(
//         `/admin-image-upload/${userId}`,
//         formData,
//         { withCredentials: true }
//       );
//       return fulfillWithValue(data);
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data || { error: 'An error occurred' });
//     }
//   }
// );

export const get_user_info = createAsyncThunk<
  ApiResponse,
  void,
  { rejectValue: ApiResponse }
>(
  'auth/get_user_info',
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get<ApiResponse>('/get-user', { withCredentials: true });
      return fulfillWithValue(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { error: 'An error occurred' });
    }
  }
);

// Initial state with TypeScript type
const initialState: AuthState = {
  successMessage: '',
  errorMessage: '',
  loader: false,
  adminUsers: [],
  totalAdmins: 0,
   adminUser: null,
   pagination: {
    totalPage: 0,
    currentPage: 1,
    perPage: 10,
    hasNext: false,
    hasPrev: false,
  },
  userInfo: null,
  role: returnRole(localStorage.getItem('accessToken')),
  token: localStorage.getItem('accessToken'),
};

// Create slice with typed reducers
export const authReducer = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    messageClear: (state) => {
      state.errorMessage = '';
      state.successMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(admin_login.pending, (state) => {
        state.loader = true;
      })
      .addCase(admin_login.rejected, (state, action) => {
        state.loader = false;
        state.errorMessage = action.payload?.error || 'Login failed';
      })
      .addCase(admin_login.fulfilled, (state, action) => {
        state.loader = false;
        state.successMessage = action.payload.message || '';
        state.token = action.payload.token || null;
        state.role = returnRole(action.payload.token || null);
      })

      // .addCase(logout.fulfilled, (state) => {
      //   state.loader = false;
      //   state.userInfo = null;
      //   state.token = null;
      //   state.role = '';
      // })

      .addCase(createAdmin.pending, (state) => {
        state.loader = true;
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.loader = false;
        state.errorMessage = action.payload?.error || 'Registration failed';
      })
      .addCase(createAdmin.fulfilled, (state, action) => {
        state.loader = false;
        state.adminUser = action.payload.admin || null;
        state.successMessage = action.payload.message || '';
      })

      .addCase(updateAdmin.pending, (state) => {
              state.loader = true;
            })
            .addCase(updateAdmin.rejected, (state, { payload }) => {
              state.loader = false;
              state.errorMessage = payload?.error || "Update failed";
            })
            .addCase(updateAdmin.fulfilled, (state, { payload }) => {
              state.loader = false;
              state.successMessage = payload.message ?? "Succesfully Updated";
            })

  

      .addCase(get_user_info.fulfilled, (state, action) => {
        state.loader = false;
        state.userInfo = action.payload.userInfo || null;
      })

      .addCase(getAllAdmins.fulfilled, (state, action) => {
              const { admins, totalAdmins, pagination} = action.payload;
      
              return {
                ...state,
                loader: false,
                adminUsers: admins || [],
                totalAdmin: totalAdmins || admins?.length|| 0,
      
                // Store pagination meta without total
                pagination: pagination
                  ? {
                    // total: pagination.total,
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

           .addCase(getAllAdmins.rejected, (state, { payload }) => {
             state.loader = false;
             state.errorMessage = payload?.error || "Failed to get accounts";
           })

             .addCase(deleteAdmin.fulfilled, (state, action) => {
                 const deletedId = action.meta.arg.userId; // Correct access point
                 // Optimistic removal
                 state.adminUsers = state.adminUsers.filter(c => Number(c.id) !== deletedId);
              
                 state.successMessage = action.payload.message || 'Deleted successfully';
               })
               .addCase(deleteAdmin.rejected, (state, action) => {
             // Use optional chaining
             if (action.meta.arg.deleteAdmin) {
               state.adminUsers = [...state.adminUsers, action.meta.arg.deleteAdmin];
             }
             state.errorMessage = action.payload?.error || 'Delete failed';
           })
           .addCase(updateAdminPassword.pending, (state) => {
              state.loader = true;
            })
            .addCase(updateAdminPassword.rejected, (state, { payload }) => {
              state.loader = false;
              state.errorMessage = payload?.error || "Update failed";
            })
            .addCase(updateAdminPassword.fulfilled, (state, { payload }) => {
              state.loader = false;
              state.successMessage = payload.message ?? "Succesfully Updated";
            })
           
     
  },
});

export const { messageClear } = authReducer.actions;
export default authReducer.reducer;