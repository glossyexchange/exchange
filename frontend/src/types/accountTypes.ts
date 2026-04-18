export interface Account {
  id: string;
  accountId: number;
  name: string;
  phone: string;
  address: string;
}

export interface AccountGet {
  accountId: number,
  name: string;
  phone: string;
  address: string;
}

export interface AccountState {
  loader: boolean;
  successMessage: string;
  errorMessage: string;
  accounts: Account[];
  account: Account | null;
  totalAccounts: number;
}

export interface FormState {
  accountId: number;
  name: string;
  phone: string;
  address: string;
  accountTypeId: number;
}
