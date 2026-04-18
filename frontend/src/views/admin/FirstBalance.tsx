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
  createFirstBalance,
  deleteFirstBalance,
  getFirstBalances,
  messageClear,
  updateFirstBalance,
} from "@/store/Reducers/firstBalanceReducer";
import { getMovementsByAccount } from "@/store/Reducers/movementReducer";
import { RootState } from "@/store/rootReducers";
import { AccountGet } from "@/types/accountTypes";
import type { FirstBalanceEditState, FirstBalanceState, FirstBalance as FirstBalanceType } from "@/types/firstBalanceType";
import { FORM_TYPES } from "@/types/formTypes";
import { Account } from "@/types/sendTransferTypes";
import { sortAccountsByAccountId } from "@/utils/accountUtils";
import { useAccountBalances } from "@/utils/useAccountBalances";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { BiEdit, BiPrinter, BiSave } from "react-icons/bi";
import { BsFileEarmarkText } from "react-icons/bs";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { PropagateLoader } from "react-spinners";
import { formatLocalDate, getCurrentTime } from "../../utils/timeConvertor";
import { overrideStyle } from "../../utils/utils";
import { useConfirmation } from "../auth/useConfirmation";
import Pagination from "../Pagination";

const FirstBalance: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === "ar" || currentLanguage === "kr";
  const dispatch = useAppDispatch();
  const searchTimeout = useRef<number | null>(null);
  const { voucherNo: voucherNoFromUrl } = useParams<{ voucherNo: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const nextInputRef = useRef<HTMLInputElement>(null);

  const { registerRef, getKeyDownHandler, getChangeHandler, focusNext } =
    useInputFocusManager(5, {
      buttonRef: submitButtonRef,
      autoFocusOnChange: true,
      textareaNavigation: "ctrl-enter",
    });

  const { currencies } = useSelector((state: RootState) => state.currency);

  const {
    successMessage,
    errorMessage,
    loader,
    newVoucherNo,
    totalFirstBalances,
    firstBalances,
  } = useSelector((state: RootState) => state.firstBalance);
  const { data: searchResults, loading } = useSelector(
    (state: RootState) => state.account.searchResults,
  );

  const balanceTypes = [
    { id: 1, balanceType: t("currencyS.debit") },
    { id: 2, balanceType: t("currencyS.dane") },
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);

  const [voucherSearch, setVoucherSearch] = useState("");
  const [displayVoucherNo, setDisplayVoucherNo] = useState<string | number>("");
  const [currencyName, setCurrencyName] = useState("");
  const [isFormEnabled, setIsFormEnabled] = useState<boolean>(true);
  const { isOpen, message, showConfirmation, hideConfirmation, confirm } =
    useConfirmation();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchValue, setSearchValue] = useState<string>("");
  const [parPage, setParPage] = useState<number>(30);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(true);

  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<FirstBalanceState>({
    currencyId: 0,
      balanceTypeId: 0,
    balanceType: "",
    createdAt: getCurrentTime(),
    accountId: 0,
    balance: 0,
    fiscalYear: new Date().getFullYear(),
    note: "",
    USER_ID: user?.id || 0,

    voucherNo:0,
    typeId: FORM_TYPES.OPENING_BALANCE_TYPE_ID,
    type: "بەڵانسی سەرەتایی/ رصید البدائي",
  });

  const [customerState, setCustomerState] = useState<Account>({
    accountId: 0,
    name: "",
    phone: "",
    address: "",
  });

  const setStartOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const setEndOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const [fromDate, setFromDate] = useState<Date | null>();
  const [toDate, setToDate] = useState<Date | null>();

  const handleFromDateChange = (date: Date | null) => {
    if (!date) return setFromDate(null);
    setFromDate(setStartOfDay(date));
  };

  const handleToDateChange = (date: Date | null) => {
    if (!date) return setToDate(null);
    setToDate(setEndOfDay(date));
  };

  const fetchFirstBalances = useCallback(() => {
    setBalanceLoading(true);
    return dispatch(
      getFirstBalances({
        parPage,
        page: currentPage,
        searchValue,
        // currencyId: state.currencyId,
        fromDate: fromDate ?? undefined,
        toDate: toDate ?? undefined,
      }),
    )
      .unwrap()
      .finally(() => {
        setBalanceLoading(false);
      });
  }, [
    dispatch,
    parPage,
    currentPage,
    searchValue,
    // state.currencyId,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    fetchFirstBalances();
  }, [fetchFirstBalances]);

  console.log(firstBalances);

  const currencyIdRef = useRef(state.currencyId);

  useEffect(() => {
    currencyIdRef.current = state.currencyId;
  }, [state.currencyId]);

  useEffect(() => {
    if (
      customerState.accountId > 0 &&
      customerState.name &&
      nextInputRef.current
    ) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        nextInputRef.current?.focus();
      }, 50);
    }
  }, [customerState.accountId, customerState.name]);

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

  

  useEffect(() => {
    return () => {
      if (searchTimeout.current !== null) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    return () => {
      setSelectedAccount(null);
      if (timeoutId) clearTimeout(timeoutId);
      dispatch(clearSearchResults());
    };
  }, [dispatch, timeoutId]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      dispatch(clearSearchResults());
    };
  }, [dispatch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerState((prev) => ({
      ...prev,
      phone: "",
      address: "",
    }));
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (timeoutId) clearTimeout(timeoutId);

    const newTimeoutId = window.setTimeout(() => {
      if (value.trim()) {
        dispatch(searchAccounts({ searchValue: value.trim() }));
        setShowResults(true);
      } else {
        dispatch(clearSearchResults());
        setShowResults(false);
      }
    }, 300);

    setTimeoutId(newTimeoutId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const input = document.getElementById("customer-search");
      if (input && !input.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateChange = (date: Date | null): void => {
    if (!date) return;

    setState((prev) => ({
      ...prev,
      createdAt: date,
    }));

    setTimeout(() => {
      const nextInput = document.querySelector(
        "[data-next-select-input]",
      ) as HTMLElement;
      if (nextInput) nextInput.focus();
    }, 10);
  };

  const {
    onAccountSelect,
     resetBalances,
  
  } = useAccountBalances(state.currencyId);



  const handleSelectAccount = (account: AccountGet) => {
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

    onAccountSelect(account.accountId);
    //  fetchDirectBalance(account.accountId);
  };

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

  const handleAccountIdDoubleClick = () => {
    setIsAccountModalOpen(true);
    fetchAccountsForModal();
  };

  const handleModalAccountSelect = async (account: AccountGet) => {
   

    // Update ALL states at once
    const updates = {
      customerState: {
        accountId: account.accountId,
        name: account.name,
        phone: account.phone || "",
        address: account.address || "",
      },
      searchTerm: account.name,
      selectedAccount: account,
      isAccountModalOpen: false,
      state: {
        ...state,
        accountId: account.accountId,
        // currencyId: currentCurrencyId, // Ensure currency is set
      },
    };

    // Apply all updates
    setCustomerState(updates.customerState);
    setSearchTerm(updates.searchTerm);
    setSelectedAccount(updates.selectedAccount);
    setIsAccountModalOpen(updates.isAccountModalOpen);
    setState(updates.state);

    // Call onAccountSelect immediately
    onAccountSelect(account.accountId);

    
    // Focus next input
    setTimeout(() => {
      if (focusNext) {
        focusNext(0);
      }
    }, 100);

    setModalSearchTerm("");
  };
  const handleModalSearch = (value: string) => {
    setModalSearchTerm(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      fetchAccountsForModal(value.trim());
    }, 300);
  };

  const closeModal = () => {
    setIsAccountModalOpen(false);
    setModalSearchTerm("");
  };

  

  const currencyTotals = useMemo(() => {
    // Map to hold totals per currency
    const groups = new Map();

    if (firstBalances && firstBalances.length > 0) {
      firstBalances.forEach((item) => {
        const balanceValue = parseFloat(item.balance) || 0;
        const currencyId = item.currencyId;
        const currencyName = item.currency?.currency || "";
        const currencySymbol = item.currency?.currencySymbol || "";

        // Get or create group for this currency
        if (!groups.has(currencyId)) {
          groups.set(currencyId, {
            currencyId,
            currencyName,
            currencySymbol,
            type1Total: 0,
            type2Total: 0,
          });
        }

        const group = groups.get(currencyId);
        if (item.balanceTypeId === 1) {
          group.type1Total += balanceValue;
        } else if (item.balanceTypeId === 2) {
          group.type2Total += balanceValue;
        }
      });
    }

    // Convert map to array for easy rendering
    return Array.from(groups.values());
  }, [firstBalances]);

  const searchAccountById = async (accountId: number) => {
    try {
      //   const currentCurrencyId = state.currencyId || currencyIdRef.current;

      //   if (!currentCurrencyId) {
      //     toast.error("Please select a currency first");
      //     return;
      //   }

      const result = await dispatch(
        getAccountByAccountId({ accountId: accountId }),
      ).unwrap();

      if (result.account) {
        const account = result.account;

        // Update all states
        setCustomerState({
          accountId: account.accountId,
          name: account.name,
          phone: account.phone || "",
          address: account.address || "",
        });

        setSearchTerm(account.name);
        setSelectedAccount(account);

        setState((prev) => ({
          ...prev,
          accountId: account.accountId,
          //   currencyId: currentCurrencyId,
        }));

        // Use timeout to ensure state is updated
        setTimeout(() => {
          // Call onAccountSelect
          onAccountSelect(account.accountId);

          // Also manually dispatch to get movements
          //   dispatch(
          //     getMovementsByAccount({
          //       currencyId: currentCurrencyId,
          //       accountId: account.accountId,
          //       page: 1,
          //       parPage: 1,
          //     }),
          //   );
        }, 50);
      }
    } catch (error) {
      console.error("Failed to search account by ID:", error);
    }
  };

  // Handlers
  const inputHandle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
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

  useEffect(() => {
    if (state.currencyId && customerState.accountId) {
      dispatch(
        getMovementsByAccount({
          currencyId: state.currencyId,
          accountId: customerState.accountId,
          page: 1,
          parPage: 1,
        }),
      );
    }

    const info = { parPage: 10, page: 1, searchValue: "" };
    dispatch(getAllCurrencies(info));
  }, [customerState.accountId, state.currencyId, dispatch]);




  const handleDeleteFirstBalance = (firstBalance: FirstBalanceType) => {
      if (window.confirm(t("currencyS.delete_confirm") || "Are you sure?")) {
        dispatch(
          deleteFirstBalance({
           voucherNo: firstBalance.voucherNo,       
    fiscalYear: firstBalance.fiscalYear,
           typeId: firstBalance.typeId,
           originalRecord: firstBalance,           
          }),
        );
      }
    };

  // Form submission
  const add = (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      state.balance,
      state.currencyId,
      state.balanceTypeId,
      customerState.accountId,
    ];

    if (requiredFields.some((field) => !field)) {
      toast.error(t("home.fill_fields"));
      return;
    }

    const createdAt = getCurrentTime();
    const fiscalYear = new Date(createdAt).getFullYear(); // adjust if your fiscal year differs

    
    
 
if (isEditing) {
  // Build update object using the current state (which already contains the key)
  const updateData: FirstBalanceEditState = {
    voucherNo: state.voucherNo,        // original voucher number
    fiscalYear: state.fiscalYear,      // original fiscal year
    currencyId: state.currencyId,
    balanceTypeId: state.balanceTypeId!,
    balanceType: state.balanceType,
    createdAt: state.createdAt,        // may have been changed by the user
    accountId: customerState.accountId,
    balance: state.balance,
    note: state.note,
    USER_ID: state.USER_ID,
    typeId: state.typeId,              // original typeId
    type: state.type,                   // original type
  };

  dispatch(updateFirstBalance(updateData)).then(() => {
    // setIsFormEnabled(false);
    setIsEditing(false);
  });
} else {
  const firstBalanceData = {
      currencyId: state.currencyId,
      // currencyType: currencyName,
      balanceTypeId: state.balanceTypeId,
      balanceType: state.balanceType,
      createdAt,
      fiscalYear, // ✅ add this
      accountId: customerState.accountId,
      balance: state.balance,
      note: state.note,
      USER_ID: state.USER_ID,
      typeId: FORM_TYPES.OPENING_BALANCE_TYPE_ID,
      type: "بەڵانسی سەرەتایی/ رصید البدائي",
    };
    dispatch(createFirstBalance(firstBalanceData)).then(() => {
      // setIsFormEnabled(false);
      setVoucherSearch("");
    });
  }
 };
  const clearAll = () => {
    setState({
      currencyId: 0,
      // currencyType: "",
      balanceTypeId: 0,
      balanceType: "",
      createdAt: getCurrentTime(),
      fiscalYear: new Date().getFullYear(),
      accountId: 0,
      balance: 0,
      note: "",
      USER_ID: user?.id || 0,
    });
    setCustomerState({
      accountId: 0,
      name: "",
      phone: "",
      address: "",
    });
    // setBalancePrev(0);
    // setBalanceNow(0);
    // setNowText("");
    // setPrevText("");

    // setIsEditMode(false);
    setIsFormEnabled(true);
    setIsEditing(false);

    setShowResults(false);
    dispatch(clearSearchResults());
    setSearchTerm("");
    setVoucherSearch("");
    setDisplayVoucherNo("");
    resetBalances();

    if (voucherNoFromUrl) {
      navigate("/admin/dashboard/payment");
    }

    // navigate("/admin/dashboard/receipts");
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      if (!isEditing) {
        // handleSave();
        setDisplayVoucherNo(newVoucherNo);
      }
       setIsFormEnabled(false);
      fetchFirstBalances();
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  return (
    <div className="px-3 pb-5 lg:px-4">
      <div className="mb-1 grid grid-cols-1 items-center justify-center gap-4 md:grid-cols-2 lg:grid-cols-2 lg:gap-3">
        <div className="flex w-full justify-center lg:justify-start">
          <h2 className="text-md font-medium mb-3 text-[#5c5a5a]">
            {t("sendTransfer.first_balance")}
          </h2>
        </div>
        <div className="flex w-full flex-col items-center gap-2 pb-3 lg:flex-row lg:justify-end lg:gap-1">
          {/* <div className="flex items-center gap-2">
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
            <button
              type="button"
      
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-[4px] text-white hover:bg-darkBlue hover:shadow-lg"
            >
              <BiSearch size={18} />
              {t("home.search")}
            </button>
          </div> */}
        </div>
      </div>

      <div className="w-full rounded-md bg-white p-4">
        <form
          onSubmit={add}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
        >
          <div className="border-b pb-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
              {/* Date - Pushed to LEFT/START */}
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

              {/* Voucher - Pushed to RIGHT/END */}
              <div className="w-full  items-center justify-center gap-2 lg:flex lg:w-64">
                <label className="block text-sm font-medium text-gray-700">
                  {t("currencyS.voucher_no")}
                </label>
                <input
                  className="w-full rounded-md border bg-gray-50 px-3 py-[6px]"
                  value={displayVoucherNo}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div ref={containerRef} className="relative mb-3 p-3">
            {/* Header */}
            <div className="mb-2">
              <h2 className="text-sm font-semibold md:text-sm">
                {t("home.account_info")}
              </h2>
            </div>

            {/* Main Form Container */}
            <div className="rounded-md border bg-gray-50 p-2 md:p-4">
              <div className="space-y-2">
                {/* Account ID and Name Row - Stack on mobile, side by side on desktop */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                  {/* Account ID Field */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label
                      htmlFor="accountId"
                      className="min-w-fit text-sm font-medium sm:w-28"
                    >
                      {t("categoryS.account_id")}
                    </label>
                    <input
                      data-next-select-input
                      ref={registerRef(0)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      placeholder={t("currencyS.search_customer_name")}
                      disabled={!isFormEnabled}
                      onKeyDown={getKeyDownHandler(0)}
                      required
                    />
                  </div>

                  {/* Account Name Field with Autocomplete */}
                  <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label
                      htmlFor="customer_name"
                      className="min-w-fit  text-sm font-medium sm:w-28"
                    >
                      {t("categoryS.account_name")}
                    </label>
                    <div className="relative w-full">
                      <input
                        id="customer_name"
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder={t("currencyS.search_customer_name")}
                        disabled={!isFormEnabled}
                        onFocus={() => {
                          if (!selectedAccount) setShowResults(true);
                        }}
                      />

                      {/* Search Results Dropdown - Better positioned for mobile */}
                      {!selectedAccount && searchTerm && showResults && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                          {loading && (
                            <div className="p-3 text-center text-sm text-gray-500">
                              Searching...
                            </div>
                          )}
                          {searchResults.map((account) => (
                            <div
                              key={account.accountId}
                              className="cursor-pointer border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-blue-50"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectAccount(account);
                              }}
                            >
                              <div className="font-medium">{account.name}</div>
                            </div>
                          ))}
                          {!loading && searchResults.length === 0 && (
                            <div className="p-3 text-center text-sm text-gray-500">
                              No matching customers
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Currency and Amount Row */}
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
                  {/* Receipt Amount */}
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                    <label
                      htmlFor="totalAmount"
                      className="min-w-fit  text-sm font-medium sm:w-28"
                    >
                      {t("paymentS.receipt_amount")}
                    </label>
                    <input
                      ref={registerRef(1)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const value = e.target.value;
                        setState({
                          ...state,
                          balance: value === "" ? 0 : parseFloat(value) || 0,
                        });
                      }}
                      value={state.balance === 0 ? "" : state.balance}
                      type="number"
                      name="totalAmount"
                      id="totalAmount"
                      min={0}
                      disabled={!isFormEnabled}
                      onKeyDown={getKeyDownHandler(1)}
                      required
                    />
                  </div>
                  {/* Currency Select */}
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                    <label
                      htmlFor="currencyId"
                      className="min-w-fit  text-sm font-medium sm:w-28"
                    >
                      {t("currencyS.currency_type")}
                    </label>
                    <select
                      ref={registerRef(2)}
                      value={state.currencyId || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setState({ ...state, currencyId: value });
                        const selectedIndex = e.target.selectedIndex;
                        const selectedText =
                          e.target.options[selectedIndex]?.text || "";
                        setCurrencyName(selectedText);
                        setTimeout(() => {
                          const nextInput = document.querySelector(
                            "[data-next-balance-type]",
                          ) as HTMLElement;
                          if (nextInput) nextInput.focus();
                        }, 10);
                      }}
                      id="currencyId"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-[3px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      onKeyDown={getKeyDownHandler(2)}
                      disabled={!isFormEnabled}
                    >
                      <option value="">{t("currencyS.select_currency")}</option>
                      {currencies?.map((currency) => (
                        <option
                          key={currency.id}
                          value={currency.currencyId}
                          title={currency.currency}
                        >
                          {currency.currency}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                    <label
                      htmlFor="balanceType"
                      className="min-w-fit text-sm font-medium sm:w-28"
                    >
                      {t("currencyS.balance_type")}
                    </label>
                    <select
                      data-next-balance-type
                      ref={registerRef(3)}
                      value={state.balanceTypeId ?? ""}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const value =
                          rawValue === "" ? null : parseInt(rawValue, 10);
                        setState((prev) => ({ ...prev, balanceTypeId: value }));

                        // Optional: store selected text if needed
                        const selectedText =
                          e.target.options[e.target.selectedIndex]?.text || "";
                        setState((prev) => ({
                          ...prev,
                          balanceType: selectedText,
                        }));

                        setTimeout(() => {
                          const nextInput = document.querySelector(
                            "[data-next-note]",
                          ) as HTMLElement;
                          if (nextInput) nextInput.focus();
                        }, 10);
                      }}
                      id="balanceType"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-[3px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      onKeyDown={getKeyDownHandler(3)}
                      disabled={!isFormEnabled}
                    >
                      <option value="">
                        {t("currencyS.select_balance_type")}
                      </option>
                      {balanceTypes.map((type) => (
                        <option
                          key={type.id}
                          value={type.id}
                          title={type.balanceType}
                        >
                          {type.balanceType}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes Field - Full Width */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <label
                    htmlFor="note"
                    className="min-w-fit text-sm font-medium sm:w-24"
                  >
                    {t("currencyS.note")}
                  </label>
                  <textarea
                    data-next-note
                    ref={registerRef(4)}
                    className="w-full rounded-md border border-gray-300 px-3 py-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      inputHandle(e);
                    }}
                    value={state.note}
                    name="note"
                    id="note"
                    rows={1}
                    disabled={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(4)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mb-6 mt-4 flex flex-col items-center gap-3 md:flex-row">
            <button
              ref={submitButtonRef}
              disabled={loader || !isFormEnabled}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#319368] px-4 py-[4px] font-medium text-white hover:bg-gray-600 hover:text-white disabled:opacity-75 md:w-auto"
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
              className="flex w-full items-center justify-center gap-2 rounded bg-yellow-600 px-6 py-[4px] font-medium text-white hover:bg-gray-600 hover:text-white disabled:opacity-75 md:w-auto"
              type="submit"
            >
              <BiPrinter size={18} /> {t("home.print")}
            </button>
          </div>
        </form>
        {/* Account Selection Modal */}
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
      </div>
      {renderConfirmationModal()}

      {/* Table */}
      {balanceLoading ? (
        <div className="py-8 text-center">Loading...</div>
      ) : firstBalances?.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          {t("home.no_data_found")}
        </div>
      ) : (
        <div className="relative overflow-x-auto" dir={isRTL ? "rtl" : "ltr"}>
          <table
            className={`w-full text-sm ${
              isRTL ? "text-right" : "text-left"
            } text-[#d0d2d6]`}
          >
            <thead className="border-b border-[#dcdada] bg-[#EEF2F7] text-sm uppercase text-[#5c5a5a]">
              <tr>
                <th className="px-4 py-2">{t("dashboardS.no")}</th>
                <th className="px-4 py-2">{t("categoryS.account_id")}</th>
                <th className="px-4 py-2">{t("orderS.name")}</th>
                <th className="px-4 py-2">{t("sendTransfer.first_balance")}</th>
                <th className="px-4 py-2">{t("currencyS.currency")}</th>
                <th className="px-4 py-2">{t("currencyS.balance_type")}</th>
                <th className="px-4 py-2">{t("orderS.date")}</th>
                <th className="px-4 py-2">{t("currencyS.note")}</th>
                <th className="flex items-center justify-end px-4 py-2">
                  {t("dashboardS.action")}
                </th>
              </tr>
            </thead>

            <tbody>
              {firstBalances?.map((p, i) => (
                <tr
                  key={i}
                  className="border-b border-[#dcdada] py-1 text-base text-[#595b5d]"
                >
                  <td className="whitespace-nowrap px-4 py-1">{i + 1}</td>
                  <td className="whitespace-nowrap px-4 py-1">
                    {p?.accountId}
                  </td>
                  <td className="whitespace-nowrap px-4 py-1">
                    {p?.account?.name}
                  </td>

                  <td className="whitespace-nowrap px-4 py-1 font-semibold">
                    {parseFloat(p.balance).toLocaleString("en-IQ")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-1">
                    {p.currency?.currency}{" "}
                  </td>
                  <td className="whitespace-nowrap px-4 py-1">
                    {p?.balanceType}
                  </td>

                  <td className="whitespace-nowrap px-4 py-1">
                    {p?.createdAt
                      ? formatLocalDate(p.createdAt).slice(0, 10)
                      : ""}
                  </td>
                  <td className="whitespace-nowrap px-4 py-1">{p?.note}</td>
                  <td className="whitespace-nowrap px-4 py-1">
                    <div className="flex items-center justify-end gap-3">
                      <div
                       onClick={() => {
  setState({
    currencyId: p.currencyId,
    accountId: p.accountId,
    balanceTypeId: p.balanceTypeId,
    balanceType: p.balanceType,
    balance: parseFloat(p.balance),
    note: p.note,
    createdAt: p.createdAt,           // keep original date (or allow update)
    fiscalYear: p.fiscalYear,         // original fiscal year – DO NOT CHANGE
    USER_ID: p.USER_ID,
    voucherNo: p.voucherNo,           // ✅ add this
    typeId: p.typeId,                 // ✅ add this
    type: p.type,                      // ✅ add this
  });
  setCustomerState({
    accountId: p.accountId,
    name: p.account?.name || "",
    phone: "",
    address: "",
  });
  setSearchTerm(p.account?.name || "");
  setIsEditing(true);
  setIsFormEnabled(false);
  setDisplayVoucherNo(p.voucherNo);
}}
                        className="cursor-pointer rounded bg-darkBlue p-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-[#2a629aab]"
                      >
                        {" "}
                        <FaEdit />{" "}
                      </div>
                      

                      <button
                        onClick={() => handleDeleteFirstBalance(p)}
                        className="rounded bg-red-500 px-[6px] py-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-red-500/50"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Totals footer */}
            <tfoot>
              {currencyTotals.map((currency) => (
                <tr
                  key={currency.currencyId}
                  className="bg-gray-100 text-base font-bold text-black"
                >
                  <td colSpan={3} className="px-8 py-2 text-left">
                    {currency.currencyName} ({currency.currencySymbol}) :
                  </td>
                  <td className="px-2 py-2">
                    {currency.type2Total.toLocaleString("en-IQ", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    (هەیەتی)
                  </td>
                  <td className="px-2 py-2">
                    {currency.type1Total.toLocaleString("en-IQ", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    (قەرزدارە)
                  </td>
                </tr>
              ))}
            </tfoot>
          </table>
        </div>
      )}
      {/* Pagination */}
      {totalFirstBalances <= parPage ? null : (
        <div className="bottom-4 right-4 mt-4 flex w-full justify-end">
          <Pagination
            pageNumber={currentPage}
            setPageNumber={setCurrentPage}
            totalItem={totalFirstBalances}
            parPage={parPage}
            showItem={Math.floor(totalFirstBalances / parPage + 1)}
          />
        </div>
      )}
    </div>
  );
};

export default FirstBalance;
