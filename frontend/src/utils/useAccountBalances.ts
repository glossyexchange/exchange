import { useAppDispatch } from "@/store/hooks";
import { getMovementsByAccount } from "@/store/Reducers/movementReducer";
import { RootState } from "@/store/rootReducers";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

export function useAccountBalances(stateCurrencyId: number | null) {
  const dispatch = useAppDispatch();
  const { totals } = useSelector((state: RootState) => state.movement);

  const [currentAccountId, setCurrentAccountId] = useState<number>(0);
  const [balances, setBalances] = useState<{
    preview: { amount: number; text: string; bg: string };
    current: { amount: number; text: string; bg: string } | null;
  }>({
    preview: { amount: 0, text: "", bg: "" },
    current: null
  });

  const calculateBalance = (taking: number, pay: number) => {
    const diff = Math.round(pay) - Math.round(taking);
    return {
      amount: Math.abs(diff),
      text: diff < 0 ? "قەرزدارە" : diff > 0 ? "هەیەتی" : "",
      bg: diff === 0 ? "" : diff > 0 ? "rgb(11, 212, 8)" : "rgb(212, 29, 8)",
    };
  };

  const fetchTotals = useCallback((accountId: number) => {
    if (!stateCurrencyId || !accountId) return;
    dispatch(
      getMovementsByAccount({
        currencyId: stateCurrencyId,
        accountId,
        page: 1,
        parPage: 1,
      })
    );
  }, [stateCurrencyId, dispatch]);

  const onAccountSelect = useCallback((accountId: number) => {
    console.log("Account selected:", accountId);
    
    // Don't reset current balance if it's the same account
    if (accountId !== currentAccountId) {
      // Reset current balance when selecting NEW account
      setBalances(prev => ({
        ...prev,
        current: null
      }));
    }
    
    setCurrentAccountId(accountId);
    fetchTotals(accountId);
  }, [fetchTotals, currentAccountId]);

  // When totals are fetched from Redux
  useEffect(() => {
    if (!totals) return;
    
    
    // Calculate the balance from totals
    const newBalance = calculateBalance(totals.amountTaking, totals.amountPay);
    
    // Update balances
    setBalances(prev => {
      // If we have a current balance, keep it
      if (prev.current) {
        return {
          preview: prev.preview, // Keep old preview
          current: newBalance    // Update current with new totals
        };
      } else {
        // No current balance yet, update preview
        return {
          preview: newBalance,
          current: null
        };
      }
    });
  }, [totals]);

  const onSave = useCallback((accountId: number) => {
    console.log("onSave called for account:", accountId);
    
    // Store the current preview balance
    const currentPreview = balances.preview;
    
    // Set the preview to current value and prepare for new current
    setBalances({
      preview: currentPreview,
      current: null // Will be updated when new totals come
    });
    
    // Fetch new totals after save
    fetchTotals(accountId);
  }, [fetchTotals, balances.preview]);

  const resetBalances = useCallback(() => {
    setCurrentAccountId(0);
    setBalances({
      preview: { amount: 0, text: "", bg: "" },
      current: null
    });
  }, []);

  const calculateBalanceFromTotals = (taking: number, pay: number) => {
    const diff = Math.round(pay) - Math.round(taking);
    return {
      amount: Math.abs(diff),
      text: diff < 0 ? "قەرزدارە" : diff > 0 ? "هەیەتی" : "",
      bg: diff === 0 ? "" : diff > 0 ? "rgb(11, 212, 8)" : "rgb(212, 29, 8)",
      isPositive: diff > 0,
    };
  };

  const getCurrentBalance = () => {
    if (!totals) return { amount: 0, text: "", bg: "", isPositive: false };
    return calculateBalanceFromTotals(totals.amountTaking, totals.amountPay);
  };

  return {
    onAccountSelect,
    onSave,
    resetBalances,
    balancePrev: balances.preview.amount,
    prevText: balances.preview.text,
    prevBg: balances.preview.bg,
    balanceNow: balances.current?.amount || 0,
    nowText: balances.current?.text || "",
    nowBg: balances.current?.bg || "",
    totals,
    currentAccountId,
    calculateBalanceFromTotals,
    getCurrentBalance,
    hasCurrentBalance: balances.current !== null,
  };
}