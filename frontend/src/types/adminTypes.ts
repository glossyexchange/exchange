export interface User {
id: number;
  name: string;
  phone: string;
  image?: string;
  role: string;
  // Add other user properties as needed
}

export interface LoginInfo {
  phone: string;
  password: string;
}

export interface RegisterInfo {
  name: string;
  phone: string;
  password: string;
  role: string;
  image?: string;
  createdAt: Date | string; 
}

export interface UpdateAdmin {
  userId: number;
  info: RegisterInfo;
}

export interface UpdatePassword {
  userId: number;
  password: string;
  newPassword: string;
}

export interface PaginationParams {
  parPage: number;
  page: number;
  searchValue: string;
}

export interface PaginationState {
  totalPage: number;
  currentPage: number;
  perPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type DeleteAdminTypePayload = {
  userId: number;
  deleteAdmin: User;
};
