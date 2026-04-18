import AccountSelectionModal from "@/components/AccountSelectionModal";
import { useAuth } from "@/context/AuthContext";
import useInputFocusManager from "@/hooks/useInputFocusManager";
import { useAppDispatch } from "@/store/hooks";
import {
  clearSearchResults,
  getAccountByAccountId,
  searchAccounts,
} from "@/store/Reducers/accountReducer";
import { getAllCurrencies } from "@/store/Reducers/currencyReducer";
import {
  createExchangeUsd,
  getExchangeUSDByVoucherNo,
  messageClear,
  updateExchangeUsd,
} from "@/store/Reducers/exchangeReducer";
import { getMovementsByAccount } from "@/store/Reducers/movementReducer";
import { RootState } from "@/store/rootReducers";
import { AccountGet } from "@/types/accountTypes";
import {
  ExchangeUSDState,
  UpdateExchangeUSDData,
} from "@/types/exchangeUsdType";
import { FORM_TYPES } from "@/types/formTypes";
import { sortAccountsByAccountId } from "@/utils/accountUtils";
import { useAccountBalances } from "@/utils/useAccountBalances";
import React, { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { BiEdit, BiPrinter, BiSave, BiSearch } from "react-icons/bi";
import { BsFileEarmarkText } from "react-icons/bs";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PropagateLoader } from "react-spinners";
import { getCurrentTime } from "../../utils/timeConvertor";
import { accountTypeId, overrideStyle } from "../../utils/utils";
import { useConfirmation } from "../auth/useConfirmation";

const exchangeTypes = [
  { id: 1, type: "کڕین" },
  { id: 2, type: "فرۆشتن" },
];

const ExchangeUSD: React.FC = () => {
  const { t } = useTranslation();
  // const currentLanguage = i18n.language;
  // const isRTL = ["ar", "kr"].includes(currentLanguage);
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const nextInputRef = useRef<HTMLInputElement>(null);
  const { fiscalYear: fiscalYearParam, voucherNo: voucherNoParam } = useParams<{
      fiscalYear?: string;
      voucherNo?: string;
    }>();
  
  const { 
  registerRef, 
  getKeyDownHandler, 
  getChangeHandler,
  focusNext 
} = useInputFocusManager(6, {
  buttonRef: submitButtonRef,
  autoFocusOnChange: true,
  textareaNavigation: 'ctrl-enter', 
});

  // const { voucherNo: voucherNoFromUrl } = useParams<{ voucherNo: string }>();
    const navigate = useNavigate();

  const { successMessage, errorMessage, loader, UsdVoucherNo, exchangeId } =
    useSelector((state: RootState) => state.exchange);
  const { data: searchResults, loading } = useSelector(
    (state: RootState) => state.account.searchResults,
  );


  // Edite
  const [isEditing, setIsEditing] = useState(false);
  const [editingExchangeId, setEditingExchangeId] = useState<number | null>(
    null,
  );
  const [voucherSearch, setVoucherSearch] = useState("");
  const [displayVoucherNo, setDisplayVoucherNo] = useState<string | number>("");
 const [searchFiscalYear, setSearchFiscalYear] = useState<number>(new Date().getFullYear());
  const [isFormEnabled, setIsFormEnabled] = useState<boolean>(true);
  const { isOpen, message, showConfirmation, hideConfirmation, confirm } =
      useConfirmation();

  const [customerState, setCustomerState] = useState<AccountGet>({
    accountId: 0,
    name: "",
    phone: "",
    address: "",
  });

  const [state, setState] = useState<ExchangeUSDState>({
    exchangeTypeId: 0,
    exchangeType: "",
    currencyId: 1,
    accountId: 0,
    amountUsd: 0,
    price: 0,
    amountIqd: 0,
    createdAt: getCurrentTime(),
    note: "",
    adminId:  user?.id || 0,
  });

const [accountBalance, setAccountBalance] = useState({
  taking: 0,
  pay: 0,
  balance: 0,
  text: "",
  bg: "",
});

const currencyIdRef = useRef(state.currencyId);

useEffect(() => {
  currencyIdRef.current = state.currencyId;
}, [state.currencyId]);

  useEffect(() => {
    const total = Math.round(state.amountUsd * state.price) || 0;

    setState((prev) => ({ ...prev, amountIqd: total }));
  }, [state.price]);

  useEffect(() => {
    if (state.amountUsd > 0) {
      setState((prev) => ({
        ...prev,
        price: state.amountIqd / state.amountUsd,
      }));
    }
  }, [state.amountIqd]);

  useEffect(() => {
    const total = Math.round(state.amountUsd * state.price) || 0;

    setState((prev) => ({ ...prev, amountIqd: total }));
  }, [state.amountUsd]);

  useEffect(() => {
  if (customerState.accountId > 0 && customerState.name && nextInputRef.current) {
    // Small delay to ensure state is updated
    setTimeout(() => {
      nextInputRef.current?.focus();
    }, 50);
  }
}, [customerState.accountId, customerState.name]);

   useEffect(() => {
      if (voucherNoParam && fiscalYearParam) {
    // const voucherNo = parseInt(voucherNoParam);
    const fiscalYear = parseInt(fiscalYearParam);
        setVoucherSearch(voucherNoParam);
  
        const loadVoucherFromUrl = async () => {
          try {
            const voucherNo = parseInt(voucherNoParam);
            if (isNaN(voucherNo)) {
              toast.error("Invalid voucher number in URL");
              navigate("/admin/dashboard/currencies-exchange");
              return;
            }
  
            const result = await dispatch(
              getExchangeUSDByVoucherNo({voucherNo, fiscalYear}),
            ).unwrap();
  
            if (result.exchangeUsd) {
              const exchangeData = result.exchangeUsd;
  
              setIsEditing(true);
              setIsFormEnabled(false);
              setEditingExchangeId(exchangeData.id);
              setDisplayVoucherNo(voucherNo);
  
              setState({
                exchangeTypeId: exchangeData.exchangeTypeId,
                exchangeType: exchangeData.exchangeType,
                currencyId: exchangeData.currencyId,
                accountId: exchangeData.accountId,
                amountUsd: exchangeData.amountUsd,
                price: exchangeData.price,
                amountIqd: exchangeData.amountIqd,
                createdAt: new Date(exchangeData.createdAt),
                note: exchangeData.note || "",
                adminId: exchangeData.adminId,
              });
   setSearchFiscalYear(exchangeData.fiscalYear),
              setCustomerState({
                accountId: exchangeData.accountId,
                name: exchangeData.account?.name || "",
                phone: exchangeData.account?.phone || "",
                address: exchangeData.account?.address || "",
              });
  
              setSearchTerm(exchangeData.account?.name || "");
              setSelectedAccount(exchangeData.account || null);
  
              onAccountSelect(exchangeData.accountId);
            } else {
              toast.error("Voucher not found");
              navigate("/admin/dashboard/currencies-exchange");
            }
          } catch (error: any) {
            toast.error(error.message || "Failed to load voucher from URL");
            navigate("/admin/dashboard/currencies-exchange");
          }
        };
  
        loadVoucherFromUrl();
      }
    }, [voucherNoParam, fiscalYearParam, dispatch, navigate]);

  // Search Voucher
  const handleSearchVoucher = async () => {
    if (!voucherSearch.trim()) {
      toast.error("Please enter a voucher number");
      return;
    }

    const voucherNo = parseInt(voucherSearch);
    if (isNaN(voucherNo)) {
      toast.error("Please enter a valid voucher number");
      return;
    }

    try {
      const result = await dispatch(
        getExchangeUSDByVoucherNo({voucherNo, fiscalYear: searchFiscalYear}),
      ).unwrap();

      if (result.exchangeUsd) {
        const exchangeData = result.exchangeUsd;

        // Set editing mode
        setIsEditing(true);
        setIsFormEnabled(false);
        setEditingExchangeId(exchangeData.id);
        setDisplayVoucherNo(voucherNo);

        // Populate form with existing data
        setState({
          exchangeTypeId: exchangeData.exchangeTypeId,
          exchangeType: exchangeData.exchangeType,
          currencyId: exchangeData.currencyId || 2, // Default to USD
          accountId: exchangeData.accountId,
          amountUsd: exchangeData.amountUsd,
          price: exchangeData.price,
          amountIqd: exchangeData.amountIqd,
          createdAt: new Date(exchangeData.createdAt),
          note: exchangeData.note,
          adminId: exchangeData.adminId,
        });
setSearchFiscalYear(exchangeData.fiscalYear),
        // Populate customer data
        setCustomerState({
          accountId: exchangeData.accountId,
          name: exchangeData.account?.name || "",
          phone: exchangeData.account?.phone || "",
          address: exchangeData.account?.address || "",
        });

        setSearchTerm(exchangeData.account?.name || "");
        setSelectedAccount(exchangeData.account || null);

        // Fetch balances for this account
        onAccountSelect(exchangeData.accountId);

        toast.success("Exchange record loaded for editing");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load voucher");
    }
  };

   const renderConfirmationModal = () => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-11/12 max-w-md rounded-lg bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="border-b text-lg font-bold text-gray-800">
              {t("home.confirmation")}
            </h2>
            <button
              onClick={hideConfirmation}
              className="rounded-md bg-red-700 px-2 py-1 text-white hover:bg-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700">{message}</p>{" "}
            {/* Use the message state */}
          </div>

          <div className="flex justify-end  gap-3 space-x-4">
            <button
              onClick={confirm}
              className="flex w-full items-center justify-center gap-2 rounded bg-green-600 px-6 py-[4px] font-medium text-white hover:bg-gray-600 hover:text-white disabled:opacity-75 md:w-auto"
            >
              {t("home.yes")}
            </button>
            <button
              onClick={hideConfirmation}
              className="flex w-full items-center justify-center gap-2 rounded bg-red-700 px-6 py-[4px] font-medium text-white hover:bg-gray-600 hover:text-white disabled:opacity-75 md:w-auto"
            >
              {t("home.no")}
            </button>
          </div>
        </div>
      </div>
    );
  };

  
  // Search Name
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDateChange = (date: Date | null): void => {
    if (!date) return;

    setState((prev) => ({
      ...prev,
      importAt: date,
    }));

    setTimeout(() => {
    const nextInput = document.querySelector('[data-next-select-currency]') as HTMLElement;
    if (nextInput) nextInput.focus();
  }, 10);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      dispatch(clearSearchResults());
    };
  }, [dispatch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAccount(null); // allow new search after selection
    setCustomerState((prev) => ({ ...prev, phone: "", address: "" }));
    const value = e.target.value;
    setSearchTerm(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = window.setTimeout(() => {
      if (value.trim()) {
        dispatch(searchAccounts({ searchValue: value.trim() }));
        setShowResults(true);
      } else {
        dispatch(clearSearchResults());
        setShowResults(false);
      }
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

   


const {
  onAccountSelect,
  onSave,
  resetBalances, 
  balancePrev,
  prevText,
  prevBg,
  balanceNow,
  nowText,
  nowBg,
  getCurrentBalance, 
  calculateBalanceFromTotals,
  totals, // Get totals from hook
} = useAccountBalances(state.currencyId);

 const fetchDirectBalance = async (accountId: number, forceCurrencyId?: number) => {
  const currencyId = forceCurrencyId || state.currencyId || currencyIdRef.current;
  
  if (!currencyId) {
    console.error("Currency ID is not set!");
    toast.error("Please select a currency first");
    return;
  }
  
  try {
    const result = await dispatch(
      getMovementsByAccount({
        currencyId: currencyId,
        accountId: accountId,
        page: 1,
        parPage: 1,
      })
    ).unwrap();
    
    // Extract totals from response
    let taking = 0;
    let pay = 0;
    
    if (result && typeof result === 'object') {
      if ('totals' in result && result.totals) {
        const totals = result.totals as any;
        taking = totals.amountTaking || 0;
        pay = totals.amountPay || 0;
      } else if ('amountTaking' in result) {
        const totals = result as any;
        taking = totals.amountTaking || 0;
        pay = totals.amountPay || 0;
      } else if ('data' in result && result.data && typeof result.data === 'object') {
        const data = result.data as any;
        if (data.totals) {
          taking = data.totals.amountTaking || 0;
          pay = data.totals.amountPay || 0;
        }
      }
    }
    
    // Calculate and set balance
    const diff = Math.round(pay) - Math.round(taking);
    const balance = Math.abs(diff);
    const text = diff < 0 ? "قەرزدارە" : diff > 0 ? "هەیەتی" : "";
    const bg = diff === 0 ? "" : diff > 0 ? "rgb(11, 212, 8)" : "rgb(212, 29, 8)";
    
    setAccountBalance({
      taking,
      pay,
      balance,
      text,
      bg,
    });
    
    // Also trigger hook update
    onAccountSelect(accountId);
    
  } catch (error: any) {
    console.error("Balance fetch error:", error);
    calculateAndSetBalance(0, 0);
  }
};

// 4. Enhanced calculateAndSetBalance with logging
const calculateAndSetBalance = (taking: number, pay: number) => {
   
  const diff = Math.round(pay) - Math.round(taking);
  const balance = Math.abs(diff);
  const text = diff < 0 ? "قەرزدارە" : diff > 0 ? "هەیەتی" : "";
  const bg = diff === 0 ? "" : diff > 0 ? "rgb(11, 212, 8)" : "rgb(212, 29, 8)";
  
  
  setAccountBalance({
    taking,
    pay,
    balance,
    text,
    bg,
  });
};


  const handleSelectAccount = (account: AccountGet) => {
    // setChangeID(true);
    setSearchTerm(account.name);
    setSelectedAccount(account);
    setCustomerState({
      accountId: account.accountId,
      name: account.name,
      phone: account.phone || "",
      address: account.address || "",
    });
    setShowResults(false);
    dispatch(clearSearchResults());

    // Use the custom hook to handle account selection
    onAccountSelect(account.accountId);

  fetchDirectBalance(account.accountId);
  };


  // Search By ID
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountsList, setAccountsList] = useState<AccountGet[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");

  const fetchAccountsForModal = async (searchTerm = "") => {
  setModalLoading(true);
  try {
    const result = await dispatch(
      searchAccounts({ searchValue: searchTerm }),
    ).unwrap();
    
    if (result.accounts) {
      // Sort by accountId (ascending - from least to greatest)
      const sortedAccounts = sortAccountsByAccountId(result.accounts);
      setAccountsList(sortedAccounts);
    }
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    toast.error("Failed to load accounts");
  } finally {
    setModalLoading(false);
  }
};

  const closeModal = () => {
  setIsAccountModalOpen(false);
  setModalSearchTerm('');
};

  // Handle double click on accountId input
  const handleAccountIdDoubleClick = () => {
    setIsAccountModalOpen(true);
    fetchAccountsForModal(); // Load all accounts initially
  };

  // Handle account selection from modal
  const handleModalAccountSelect = async (account: AccountGet) => {
    
  // Get current currencyId
  const currentCurrencyId = state.currencyId || currencyIdRef.current;
  
  if (!currentCurrencyId) {
    toast.error("Please select a currency first");
    return;
  }
  
  // Update states
  setCustomerState({
    accountId: account.accountId,
    name: account.name,
    phone: account.phone || "",
    address: account.address || "",
  });
  
  setSearchTerm(account.name);
  setSelectedAccount(account);
  setIsAccountModalOpen(false);
  
  // Update form state
  setState(prev => ({
    ...prev,
    accountId: account.accountId
  }));
  
  // Call hook
  onAccountSelect(account.accountId);
  
  // Fetch balance with explicit currencyId
  await fetchDirectBalance(account.accountId, currentCurrencyId);
  
  // Focus next input
  setTimeout(() => {
    if (focusNext) {
      focusNext(1);
    }
  }, 100);
};

    const handleModalSearch = (value: string) => {
       setModalSearchTerm(value);
  
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  timeoutRef.current = window.setTimeout(() => {
    fetchAccountsForModal(value.trim());
  }, 300);
    };

const handleSave = async () => {
  if (state.currencyId && customerState.accountId) {
        
    // Call hook's onSave
    onSave(customerState.accountId);
    
    // Wait and then manually refresh the balance
    setTimeout(async () => {
      console.log("Manual balance refresh after save");
      
      // Force a fresh balance fetch
      await fetchDirectBalance(customerState.accountId, state.currencyId);
      
      // Also trigger the hook to update its internal state
      onAccountSelect(customerState.accountId);
      
      // Focus
      if (focusNext) {
        focusNext(5);
      }
    }, 800); // Longer delay to ensure save completes
  }
};


   const searchAccountById = async (accountId: number) => {
  try {
    const currentCurrencyId = state.currencyId || currencyIdRef.current;
    
    if (!currentCurrencyId) {
      toast.error("Please select a currency first");
      return;
    }
    
    const result = await dispatch(
      getAccountByAccountId({ accountId }), 
    ).unwrap();
  
    if (result.account) {
      const account = result.account;
      
      setCustomerState({
        accountId: account.accountId,
        name: account.name,
        phone: account.phone || "",
        address: account.address || "",
      });
      
      setSearchTerm(account.name);
      setSelectedAccount(account);
      
      // Update form state
      setState(prev => ({
        ...prev,
        accountId: account.accountId
      }));
      
      // Call hook
      onAccountSelect(account.accountId);
      
      // Fetch balance
      await fetchDirectBalance(account.accountId, currentCurrencyId);
    }
  } catch (error) {
    console.error("Failed to search account by ID:", error);
    toast.error("Account not found");
  }
};



useEffect(() => {
  if (customerState.accountId > 0 && state.currencyId) {
      fetchDirectBalance(customerState.accountId);
  }
}, [customerState.accountId, state.currencyId]);

// 9. Add useEffect to sync local balance with hook's totals
useEffect(() => {
  if (totals) {
       calculateAndSetBalance(totals.amountTaking, totals.amountPay);
  }
}, [totals]);




  const handleCustomerInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setCustomerState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const inputHandle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const value = parseInt(e.target.value) || 0;
  const selectedExchange = exchangeTypes.find(
    (exchange) => exchange.id === value,
  );

  if (selectedExchange) {
    setState({
      ...state,
      exchangeTypeId: value,
      exchangeType: selectedExchange.type,
    });
  }
  
  // Auto-focus to next input
  setTimeout(() => {
    const nextInput = document.querySelector('[data-next-input]') as HTMLElement;
    if (nextInput) nextInput.focus();
  }, 10);
};

 

  useEffect(() => {
    const obj = { parPage: 10, page: 1, searchValue: "" };
    dispatch(getAllCurrencies(obj));
  }, []);

  const enableEditMode = () => {
    showConfirmation(t("home.are_you_sure_to_update"), () => {
      setIsFormEnabled(true);
      // setIsEditMode(true);
        setIsEditing(true);
    });
  };

  const handleClearWithConfirmation = () => {
    showConfirmation(t("home.are_you_sure_to_clear"), () => {
      clearAll();
    });
  };

    const getVoucherNumber = (): number | null => {
    if (voucherNoParam) return parseInt(voucherNoParam);
    if (voucherSearch) return parseInt(voucherSearch);
    if (UsdVoucherNo) return parseInt(String(UsdVoucherNo));
    return null;
  };

  // Form submission
  const add = (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      state.amountUsd,
      state.price,
      customerState.accountId,
    ];

    if (requiredFields.some((field) => !field)) {
      toast.error(t("home.fill_fields"));
      return;
    }

    const orderData = {
      exchangeTypeId: state.exchangeTypeId,
      exchangeType: state.exchangeType,
      currencyId: state.currencyId,
      accountId: customerState.accountId,
      amountUsd: state.amountUsd,
      price: state.price,
      amountIqd: state.amountIqd,
      note: state.note,
      adminId: state.adminId,
      createdAt: state.createdAt,
      currencyType: "دۆلار",
      typeId: FORM_TYPES.EXCHANGEUSD,
      type: `${t("dashboard.Exchange USD")}`,
      Hmula_ID: accountTypeId.Hmula_ID,
      ExchangeUsd_ID: accountTypeId.ExchangeUsd_ID,
    };

    if (isEditing) {
      const voucherNo = getVoucherNumber();
      if (voucherNo === null) {
        alert("Please provide a voucher number");
        return;
      }
      const updateData: UpdateExchangeUSDData = {
        ...orderData,
        id: editingExchangeId || exchangeId,
       voucherNo: voucherNo,
      };
      dispatch(updateExchangeUsd(updateData));
      // setIsFormEnabled(false);
      // setIsEditing(false);
        // setIsEditMode(false);
    } else {
      dispatch(createExchangeUsd(orderData));
        // setIsFormEnabled(false);
        setVoucherSearch("");
    }
  };

  // Update clear function
  const clearAll = () => {
    setState({
      exchangeTypeId: 0,
      exchangeType: "",
      currencyId: 2,
      accountId: 0,
      amountUsd: 0,
      price: 0,
      amountIqd: 0,
      createdAt: getCurrentTime(),
      note: "",
      adminId:  user?.id || 0,
    });
    setCustomerState({
      accountId: 0,
      name: "",
      phone: "",
      address: "",
    });
    // setExchangeTypeName("");
    setShowResults(false);
    dispatch(clearSearchResults());
    setSearchTerm("");
   
    // setIsEditMode(false);
    setIsFormEnabled(true);
    setIsEditing(false);

    setEditingExchangeId(null);
    setVoucherSearch("");
    setDisplayVoucherNo("");
    // Reset the balance states
    resetBalances();
     resetBalances();
   if (voucherNoParam || fiscalYearParam) { 
      navigate("/admin/dashboard/exchange-usd");
    }
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      // clearAll();
      if (!isEditing) {
        handleSave();
        setDisplayVoucherNo(UsdVoucherNo); 
      }
       setIsFormEnabled(false);
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  return (
    <div className="px-3 pb-3 lg:px-4">
      <div className="mb-1 grid grid-cols-1 items-center justify-center gap-4 md:grid-cols-2 lg:grid-cols-2 lg:gap-3">
        <div className="flex w-full justify-center lg:justify-start">
          <h2 className="text-md font-medium text-[#5c5a5a]">
            {t("dashboard.Exchange USD")}
          </h2>
        </div>
       <div className="flex w-full flex-col gap-2 pb-3 lg:flex-row items-center lg:justify-end lg:gap-1">
          <div className="flex items-center gap-2">
            <label htmlFor="search_voucher">{t("home.search")}</label>
            <input
              className="input-field rounded-md border border-gray-300 px-2 py-1 placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={voucherSearch}
              onChange={(e) => setVoucherSearch(e.target.value)}
              type="number"
              name="search_voucher"
              id="search_voucher"
              placeholder={t("home.search_voucher")}
            />
            <input
    className="input-field w-24 rounded border px-2 py-1"
    value={searchFiscalYear}
    onChange={(e) => setSearchFiscalYear(parseInt(e.target.value) || new Date().getFullYear())}
    type="number"
    placeholder="Year"
  />
          <button
            type="button"
            onClick={handleSearchVoucher}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-[4px] text-white hover:bg-darkBlue hover:shadow-lg"
          >
            <BiSearch size={18} />
            {t("home.search")}
          </button>
          </div>
             <div className="flex items-center gap-2">
          
                    {/* {isEditing && (
                      <button
                        type="button"
                        onClick={handleClearWithConfirmation}
                        className="flex items-center gap-2 rounded-md bg-red-500 px-4 py-[4px] text-white hover:bg-gray-600"
                      >
                        <BsFileEarmarkText size={18} /> {t("home.new")}
                      </button>
                    )} */}
                    <div className="flex justify-end">
                      <label htmlFor="phone"></label>
                      <Link
                        to="/admin/dashboard/exchange-usd-list"
                        className="rounded-md bg-primary px-5 py-[4px] text-white hover:bg-darkBlue hover:shadow-lg"
                      >
                         {t("dashboard.Exchange USD List")}
                      </Link>
                    </div>
                     </div>
        </div>
      </div>

      <div className="w-full rounded-md bg-white p-4">
        <form onSubmit={add}>
          <div className="grid grid-cols-2 items-center justify-between gap-2 border-b pb-3  md:grid-cols-2 lg:grid-cols-2">
            {/* <div className="flex justify-between gap-2 pb-2"> */}

            <div className="items-center justify-start gap-2 lg:flex">
              <label htmlFor="date">{t("importCarS.import_date")}</label>

              <DatePicker
                selected={state.createdAt}
                onChange={handleDateChange}
                id="date"
                  disabled={!isFormEnabled}
                dateFormat="yyyy-MM-dd"
                className="input-field justify-center rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="items-center justify-end gap-2  lg:flex">
              <label htmlFor="chassisNumber">{t("currencyS.voucher_no")}</label>
              <input
                className="input-field rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={displayVoucherNo}
                type="text"
                name="chassisNumber"
                id="chassisNumber"

                disabled
              />
            </div>
            {/* </div> */}
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 py-4 md:grid-cols-3 lg:grid-cols-5">
            <div className="flex w-full items-center gap-2">
              <label className="w-3/6" htmlFor="exchangeTypeId">
                {t("dashboardS.type")}
              </label>
              <select
              data-next-select-currency
              ref={registerRef(0)}
                value={state.exchangeTypeId}
                 onChange={handleSelectChange}
                
                id="exchangeTypeId"
                className="w-full rounded-md border border-slate-400 bg-[#ffffff] px-2 py-1 text-sm font-medium text-[#000000] focus:border-secondary"
                onKeyDown={getKeyDownHandler(0)} 
                required
                  disabled={!isFormEnabled}
              >
                <option value="">{t("dashboardS.select_exchange_type")}</option>
                {exchangeTypes?.map((exchange) => (
                  <option key={exchange.id} value={exchange.id}>
                    {exchange.type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            ref={containerRef}
            className="relative mb-3 grid grid-cols-1 gap-2  p-3 "
          >
            <div className="flex flex-col gap-1">
              <h2>{t("home.account_info")}</h2>
            </div>
            <div className="grid grid-cols-1 justify-between gap-4 border bg-gray-100 p-3 md:grid-cols-2 lg:grid-cols-2">
              {/* <div className="flex justify-between items-start"> */}
              <div className="flex flex-col gap-1 pb-2">
                <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-4">
                  <div className="col-span-1 flex flex-col gap-1 pb-2">
                    <label htmlFor="accountId">
                      {t("categoryS.account_id")}
                    </label>

                   <input
                   data-next-input
                   ref={registerRef(1)}
                      className="rounded-md border border-gray-300 px-3 py-[6px] placeholder:text-xs"
                      value={
                        customerState.accountId === 0
                          ? ""
                          : customerState.accountId.toString()
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? 0 : parseInt(value, 10);

                        setCustomerState((prev) => ({
                          ...prev,
                          accountId: isNaN(numValue) ? 0 : numValue,
                        }));

                        if (numValue > 0) {
                          const timeoutId = setTimeout(() => {
                            searchAccountById(numValue);
                          }, 100);

                          return () => clearTimeout(timeoutId);
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        const numValue = parseInt(value, 10);

                   
                        if (!isNaN(numValue) && numValue > 0) {
                          searchAccountById(numValue);
                        }
                      }}
                      onDoubleClick={handleAccountIdDoubleClick}
                      type="text"
                      id="accountId"
                      name="accountId"
                        disabled={!isFormEnabled}
                      placeholder={t("currencyS.search_customer_name")}
                      onKeyDown={getKeyDownHandler(1)}
                      required
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1 pb-2">
                    <label htmlFor="customer_name">
                      {t("categoryS.account_name")}
                    </label>
                    <input
                     
                      id="customer_name"
                      type="text"
                      className="rounded-md border px-2 py-[6px] placeholder:text-xs"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder={t("currencyS.search_customer_name")}
                       disabled={!isFormEnabled}
                       
                      onFocus={() => {
                        if (!selectedAccount) setShowResults(true);
                      }}
                    />
                    {!selectedAccount && searchTerm && showResults && (
                      <div
                        className={`absolute z-10  mt-[68px] max-h-60  w-full gap-4 overflow-auto  rounded-md  border border-gray-200 bg-white  md:w-1/3 lg:w-1/5`}
                      >
                        {loading && (
                          <div className="p-2 text-center text-sm text-gray-500">
                            Searching...
                          </div>
                        )}
                        {searchResults.map((account) => (
                          <div
                            key={account.accountId}
                            className="cursor-pointer border-b border-gray-100 px-4 py-3 hover:bg-blue-50"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectAccount(account);
                            }}
                          >
                            <div className="font-medium">{account.name}</div>
                          </div>
                        ))}
                        {!loading && searchResults.length === 0 && (
                          <div className="p-2 text-center text-sm text-gray-500">
                            No matching customers
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex flex-col gap-1 pb-2">
                    <label htmlFor="address">{t("currencyS.address")}</label>
                    <input
                      className="rounded-md border border-gray-300 px-2 py-[6px]"
                      value={customerState.address}
                      onChange={handleCustomerInputChange}
                      type="text"
                      id="address"
                      name="address"
                      autoComplete="address"
                      readOnly={!!customerState.accountId}
                    />
                  </div>
                  <div className="flex  flex-col gap-1 pb-2">
                    <label htmlFor="phone">{t("customerS.phone")}</label>
                    <input
                      className="rounded-md border border-gray-300 px-2 py-[6px]"
                      value={customerState.phone}
                      onChange={handleCustomerInputChange}
                      type="text"
                      id="phone"
                      autoComplete="phone"
                      readOnly={!!customerState.accountId}
                    />
                  </div>
                </div>
              </div>
      {/* Balance Section */}
<div className="flex w-full justify-end">
  <div className="grid grid-cols-1 gap-1 bg-slate-200 px-3 py-2 md:grid-cols-1 lg:grid-cols-1">
    {/* Previous Balance from Hook */}
    <div className="col-span-2 flex flex-col gap-1 pb-2">
      <div className="whitespace-nowrap text-sm">
        {t("currencyS.balance_prev")}
      </div>
      <div className="flex w-full flex-row gap-2">
        <input
          className="input-field rounded-md border border-gray-300 bg-gray-50 px-2 py-[6px]"
          value={balancePrev || 0}
          type="number"
          disabled
          readOnly
        />
        <input
          className="w-2/5 rounded-md border border-gray-300 px-2 py-[6px] text-sm"
          style={{ color: prevBg || "#000000" }}
          value={prevText || ""}
          type="text"
          readOnly
        />
      </div>
    </div>
    
    {/* Current Balance from Hook */}
    <div className="col-span-2 flex flex-col gap-1 py-2">
      <div className="whitespace-nowrap text-sm">
        {t("currencyS.balance_now")}
      </div>
      <div className="flex w-full flex-row gap-2">
        <input
          className="input-field rounded-md border border-gray-300 bg-gray-50 px-2 py-[6px]"
          value={balanceNow || 0}
          type="number"
          disabled
          readOnly
        />
        <input
          className="w-2/5 rounded-md border border-gray-300 px-2 py-[6px] text-sm"
          style={{ color: nowBg || "#000000" }}
          value={nowText || ""}
          type="text"
          readOnly
        />
      </div>
    </div>
  </div>
</div>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex w-full items-center gap-2">
              <label htmlFor="amountUsd">{t("home.usd_amount")}</label>
              <input
              
               ref={registerRef(2)}
                className="input-field rounded-md border border-gray-300 px-2 py-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const value = e.target.value;
                  setState({
                    ...state,
                    amountUsd: value === "" ? 0 : parseInt(value) || 0,
                  });
                }}
                value={state.amountUsd === 0 ? "" : state.amountUsd}
                type="number"
                name="amountUsd"
                id="amountUsd"
                 disabled={!isFormEnabled}
                 onKeyDown={getKeyDownHandler(2)}
                required
              />
              <h2>{t("dashboardS.currency_USD")}</h2>
            </div>
          </div>
          <div className="mb-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex w-full items-center gap-2">
              <label htmlFor="price">{t("home.price_exchange")}</label>
              <input
              ref={registerRef(3)}
                className="input-field rounded-md border border-gray-300 px-2 py-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const value = e.target.value;
                  setState({
                    ...state,
                    price: value === "" ? 0 : parseInt(value) || 0,
                  });
                }}
                value={state.price === 0 ? "" : state.price}
                type="number"
                name="price"
                id="price"
                 disabled={!isFormEnabled}
                   onKeyDown={getKeyDownHandler(3)}
                required
              />
            </div>
          </div>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex w-full items-center gap-2">
              <label htmlFor="amountIqd">{t("home.iqd_amount")}</label>
              <input
              ref={registerRef(4)}
                className="input-field rounded-md border border-gray-300 px-2 py-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const value = e.target.value;
                  setState({
                    ...state,
                    amountIqd: value === "" ? 0 : parseInt(value) || 0,
                  });
                }}
                value={state.amountIqd === 0 ? "" : state.amountIqd}
                type="number"
                name="amountIqd"
                id="amountIqd"
                 disabled={!isFormEnabled}
                   onKeyDown={getKeyDownHandler(4)}
                required
              />
              <h2>{t("dashboardS.currency_IQD")}</h2>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex w-full items-center gap-2">
              <label htmlFor="note">{t("currencyS.note")}</label>
              <textarea
              ref={registerRef(5)}
                className="input-field w-full rounded-md border border-gray-300 p-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
    inputHandle(e); 
  
  }}
                value={state.note}
                name="note"
                id="note"
                 disabled={!isFormEnabled}
                  onKeyDown={getKeyDownHandler(5)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mb-4 mt-8 flex flex-col items-center gap-2 md:flex-row">
            
            <button
            ref={submitButtonRef}
             disabled={loader || !isFormEnabled}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#319368] px-4 py-[4px] font-medium text-white hover:bg-[#2d75b5] hover:text-white disabled:opacity-75 md:w-auto"
              type="submit"
            >
              {loader ? (
                <PropagateLoader
                  color="#fff"
                  cssOverride={overrideStyle}
                  size={15}
                />
              ) : (
                <>
                  <BiSave size={18} /> {t("currencyS.save")}
                </>
              )}
            </button>
            <button
              type="button"
               onClick={handleClearWithConfirmation}
              className="flex w-full items-center justify-center gap-2 rounded bg-red-500 px-3 py-[4px] font-medium text-white hover:bg-gray-600 hover:text-white disabled:opacity-75 md:w-auto"
            >
              <BsFileEarmarkText size={18} /> {t("home.new")}
            </button>
            {!isFormEnabled && (
                          <button
                            type="button"
                            onClick={enableEditMode}
                            className="flex w-full items-center justify-center gap-2 rounded bg-primary px-8 py-[4px] font-medium text-white hover:bg-gray-600 hover:text-white disabled:opacity-75 md:w-auto"
                          >
                            <BiEdit size={18} /> {t("paymentS.update")}
                          </button>
                        )}
            <button
              disabled={loader}
              className="flex w-full items-center justify-center gap-2 rounded bg-yellow-600 px-4 py-[4px] font-medium text-white hover:bg-yellow-700 hover:text-white disabled:opacity-75 md:w-auto"
              type="submit"
            >
              {/* {loader ? (
                <PropagateLoader
                  color="#fff"
                  cssOverride={overrideStyle}
                  size={15}
                />
              ) : (
                <> */}
              <BiPrinter size={18} /> {t("home.print")}
              {/* </>
              )} */}
            </button>
          </div>
        </form>

        {/* Account Selection Modal */}
        {/* {isAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-11/12 max-w-4xl rounded-lg bg-white px-6 py-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-md font-bold text-gray-800">
                  {t("home.select_account")}
                </h2>
                <button
                  onClick={() => setIsAccountModalOpen(false)}
                  className="rounded-md bg-red-500 px-2 py-[3px] text-white hover:bg-gray-400"
                >
                  ✕
                </button>
              </div>

             
              <div className="mb-4 w-6/12">
                <input
                  type="text"
                  placeholder={t("currencyS.search_customer_name")}
                  value={modalSearchTerm}
                  onChange={handleModalSearch}
                  className="w-full rounded-md border border-gray-300 px-3 py-[6px] placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        {t("dashboardS.no")}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        {t("categoryS.account_id")}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        {t("categoryS.account_name")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {t("customerS.phone")}
                      </th>
                  
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        {t("home.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {modalLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-2 text-center">
                          <div className="flex justify-center">
                            <PropagateLoader color="#319368" size={10} />
                          </div>
                        </td>
                      </tr>
                    ) : accountsList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-2 text-center text-gray-500"
                        >
                          {t("home.no_accounts_found")}
                        </td>
                      </tr>
                    ) : (
                      accountsList.map((account, i) => (
                        <tr
                          key={account.accountId}
                          className="hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-6 py-2 text-center text-sm text-gray-900">
                            {i + 1}
                          </td>
                          <td className="whitespace-nowrap px-6 py-2 text-center text-sm text-gray-900">
                            {account.accountId}
                          </td>
                          <td className="whitespace-nowrap px-6  py-2 text-center text-sm text-gray-900">
                            {account.name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-2 text-center text-sm text-gray-900">
                            {account.phone || "-"}
                          </td>
                       
                          <td className="whitespace-nowrap px-6 py-2 text-center text-sm">
                            <button
                              onClick={() => handleModalAccountSelect(account)}
                              className="rounded-md bg-primary px-3 py-1 text-white hover:bg-darkBlue"
                            >
                              {t("home.select")}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsAccountModalOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded bg-red-500 px-3 py-[4px] font-medium text-white hover:bg-gray-600 hover:text-white disabled:opacity-75 md:w-auto"
                >
                  {t("home.cancel")}
                </button>
              </div>
            </div>
          </div>
        )} */}
      </div>
      <AccountSelectionModal
              isOpen={isAccountModalOpen}
              onClose={closeModal}
              title={t("home.select_account")}
              searchPlaceholder={t("currencyS.search_customer_name")}
              searchValue={modalSearchTerm}
              onSearchChange={handleModalSearch}
              accounts={accountsList}
              loading={modalLoading}
              onAccountSelect={handleModalAccountSelect}
              noAccountsMessage={t("home.no_accounts_found")}
              accountIdColumnText={t("categoryS.account_id")}
              accountNameColumnText={t("categoryS.account_name")}
              cancelButtonText={t("home.cancel")}
            />
       {renderConfirmationModal()}
    </div>
  );
};

export default ExchangeUSD;
