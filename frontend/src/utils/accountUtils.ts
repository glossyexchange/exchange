import { Account } from "@/types/accountTypes";

export const sortAccountsByAccountId = (accounts: Account[]): Account[] => {
  return [...accounts].sort((a, b) => (a.accountId || 0) - (b.accountId || 0));
};