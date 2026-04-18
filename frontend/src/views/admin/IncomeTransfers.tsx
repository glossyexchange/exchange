import { useAppDispatch } from "@/store/hooks";
import {
  clearSearchResults,
  getAccountByAccountId,
  searchAccounts,
} from "@/store/Reducers/accountReducer";
import { getAllCurrencies } from "@/store/Reducers/currencyReducer";

import { RootState } from "@/store/rootReducers";
import { AccountGet } from "@/types/accountTypes";
import { FORM_TYPES } from "@/types/formTypes";

import AccountSelectionModal from "@/components/AccountSelectionModal";
import { useAuth } from "@/context/AuthContext";
import useInputFocusManager from "@/hooks/useInputFocusManager";
import {
  createIncomeTransfer,
  deleteCancelledIncomeTransfer,
  getIncomeTransfer,
  messageClear,
  updateIncomeTransfer,
} from "@/store/Reducers/incomeTransferReducer";
import {
  IncomeTransferState,
  UpdateIncomeTransferData,
} from "@/types/incomeTransferType";
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
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { PropagateLoader } from "react-spinners";
import { getCurrentTime } from "../../utils/timeConvertor";
import { accountTypeId, overrideStyle } from "../../utils/utils";
import { useConfirmation } from "../auth/useConfirmation";


const IncomeTransfers: React.FC = () => {
  const { t } = useTranslation();
  // const currentLanguage = i18n.language;
  // const isRTL = ["ar", "kr"].includes(currentLanguage);
  const dispatch = useAppDispatch();
     const { fiscalYear: fiscalYearParam, voucherNo: voucherNoParam } = useParams<{
      fiscalYear?: string;
      voucherNo?: string;
    }>();
  // const { voucherNo: voucherNoFromUrl } = useParams<{ voucherNo: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const submitButtonRef = useRef<HTMLButtonElement>(null);
        const nextInputRef = useRef<HTMLInputElement>(null);
        
        
        const { 
        registerRef, 
        getKeyDownHandler, 
        getChangeHandler,
        focusNext 
      } = useInputFocusManager(13, {
        buttonRef: submitButtonRef,
        autoFocusOnChange: true,
        textareaNavigation: 'ctrl-enter', 
      });

  const { user } = useAuth();


  const { currencies } = useSelector((state: RootState) => state.currency);

  const {
    successMessage,
    errorMessage,
    loader,
    transferVoucherNo,
    transferId,
    incomeTransfer,
  } = useSelector((state: RootState) => state.incomeTransfer);
  const { data: searchResults, loading } = useSelector(
    (state: RootState) => state.account.searchResults,
  );

    

  const [isRestoringCancelledTransfer, setIsRestoringCancelledTransfer] =
    useState(false);
  const [originalCancelledVoucherNo, setOriginalCancelledVoucherNo] = useState<
    number | null
  >(null);
  const [searchFiscalYear, setSearchFiscalYear] = useState<number>(new Date().getFullYear());
  const [isNewTransfer, setIsNewTransfer] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormEnabled, setIsFormEnabled] = useState<boolean>(true);
  const [displayVoucherNo, setDisplayVoucherNo] = useState<string | number>("");
  const [displayTransferId, setDisplayTransferId] = useState<number>(0);
 
  const [voucherSearch, setVoucherSearch] = useState("");

  const [currencyName, setCurrencyName] = useState("");

  // const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const { isOpen, message, showConfirmation, hideConfirmation, confirm } =
    useConfirmation();

  // Search Name

  const [searchSenderTerm, setSearchSenderTerm] = useState("");
  const [selectedSenderAccount, setSelectedSenderAccount] = useState<any>(null);
  const [showSenderResults, setShowSenderResults] = useState(false);

  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [senderState, setSenderState] = useState<AccountGet>({
    accountId: 0,
    name: "",
    phone: "",
    address: "",
  });

  const [state, setState] = useState<IncomeTransferState>({
    id: 0,
    currencyId: 0,
    ComSender_ID: 0,
    HmulafromComSender: 0,
    HmulatoComSender: 0,
    RecieverPerson: "",
    RecieverAddress: "",
    RecieverPhone: "",
    SenderPerson: "",
    SenderAddress: "",
    SenderPhone: "",
    AmountTransfer: 0,
    HmulafromReceiver: 0,
    TotalTransferToReceiver: 0,
    Notes: "",
    createdAt: getCurrentTime(),
    USER_ID: user?.id || 0,
  });

     const currencyIdRef = useRef(state.currencyId);
    
      
    
      useEffect(() => {
        currencyIdRef.current = state.currencyId;
      }, [state.currencyId]);

  const populateFormFromCancelledTransfer = (cancelledData: any) => {
    setIsRestoringCancelledTransfer(true);
    setIsNewTransfer(true);
    setIsEditing(false);
    setIsFormEnabled(true);
    

    // Keep original voucher number for reference
    setOriginalCancelledVoucherNo(cancelledData.voucherNo || null);
    setDisplayVoucherNo(""); // Empty for new transfer
    setDisplayTransferId(0);
    // setEditingExchangeId(null);

    // Populate all form fields WITHOUT the voucher number
    setState({
      id: 0, // Always 0 for new transfer
      currencyId: cancelledData.currencyId || 0,
      ComSender_ID: cancelledData.comSenderId || 0,
      HmulafromComSender: cancelledData.HmulafromComSender || 0,
      HmulatoComSender: cancelledData.HmulatoComSender || 0,

      RecieverPerson:
        cancelledData.RecieverPerson || cancelledData.receiver?.name || "",
      RecieverAddress:
        cancelledData.RecieverAddress || cancelledData.receiver?.address || "",
      RecieverPhone:
        cancelledData.RecieverPhone || cancelledData.receiver?.phone || "",
      SenderPerson:
        cancelledData.SenderPerson || cancelledData.sender?.name || "",
      SenderAddress:
        cancelledData.SenderAddress || cancelledData.sender?.address || "",
      SenderPhone:
        cancelledData.SenderPhone || cancelledData.sender?.phone || "",
      AmountTransfer: cancelledData.AmountTransfer || 0,
      HmulafromReceiver: cancelledData.HmulafromReceiver || 0,
      TotalTransferToReceiver: cancelledData.TotalTransferToReceiver || 0,
      Notes: `Restored from cancelled transfer #${cancelledData.voucherNo}\n${
        cancelledData.Notes || ""
      }`,
      createdAt: new Date(),
      USER_ID: cancelledData.USER_ID || 1,
    });
setSearchFiscalYear(cancelledData.fiscalYear),
    setSenderState({
      accountId: cancelledData.comSenderId,
      name: cancelledData.sender?.name || "",
      phone: cancelledData.sender?.phone || "",
      address: cancelledData.sender?.address || "",
    });

    setSearchSenderTerm(
      cancelledData.sender?.name || cancelledData.SenderPerson || "",
    );

    setCurrencyName(cancelledData.currency?.currency || "");
    setSelectedSenderAccount(cancelledData.sender || null);
  };

  // Function 2: Populate form for viewing/editing existing active transfer
  const populateFormForExistingTransfer = (incomeTransferData: any) => {
    setIsRestoringCancelledTransfer(false);
    setIsNewTransfer(false);
    setIsEditing(false);
    setIsFormEnabled(false);
    // setEditingExchangeId(incomeTransferData.id);
    setDisplayVoucherNo(incomeTransferData.voucherNo);
    setDisplayTransferId(incomeTransferData.id);

    setState({
      id: incomeTransferData.id,
      currencyId: incomeTransferData.currencyId,
      ComSender_ID: incomeTransferData.ComSender_ID,
      HmulafromComSender: incomeTransferData.HmulafromComSender || 0,
      HmulatoComSender: incomeTransferData.HmulatoComSender || 0,
      RecieverPerson: incomeTransferData.RecieverPerson || "",
      RecieverAddress: incomeTransferData.RecieverAddress || "",
      RecieverPhone: incomeTransferData.RecieverPhone || "",
      SenderPerson: incomeTransferData.SenderPerson || "",
      SenderAddress: incomeTransferData.SenderAddress || "",
      SenderPhone: incomeTransferData.SenderPhone || "",
      AmountTransfer: incomeTransferData.AmountTransfer,
      HmulafromReceiver: incomeTransferData.HmulafromReceiver || 0,
      TotalTransferToReceiver: incomeTransferData.TotalTransferToReceiver,
      Notes: incomeTransferData.Notes || "",
      createdAt: new Date(incomeTransferData.createdAt),
      USER_ID: incomeTransferData.USER_ID,
    });

    setSenderState({
      accountId: incomeTransferData.ComSender_ID,
      name:
        incomeTransferData.sender?.name ||
        incomeTransferData.SenderPerson ||
        "",
      phone:
        incomeTransferData.sender?.phone ||
        incomeTransferData.SenderPhone ||
        "",
      address:
        incomeTransferData.sender?.address ||
        incomeTransferData.SenderAddress ||
        "",
    });

    setSearchSenderTerm(
      incomeTransferData.sender?.name || incomeTransferData.SenderPerson || "",
    );
    setCurrencyName(incomeTransferData.currency?.currency || "");
    setSelectedSenderAccount(incomeTransferData.sender || null);
  };

  // Function 4: Load existing transfer from API
 const loadExistingTransfer = async (voucherNo: number, fiscalYear:number) => {
    try {
      const result = await dispatch(
        getIncomeTransfer({voucherNo, fiscalYear}),
      ).unwrap();

      if (result.incomeTransfer) {
        populateFormForExistingTransfer(result.incomeTransfer);
      } else {
        toast.error("Transfer not found");
        navigate("/admin/dashboard/send-transfer");
      }
    } catch (error: any) {
      console.error("❌ API fetch failed:", error);

      // Check if this might be a cancelled transfer
      const localStorageData = localStorage.getItem(
        `restore_cancelled_transfer`,
      );
      if (localStorageData) {
        try {
          const parsedData = JSON.parse(localStorageData);
          // if (parsedData.data.voucherNo === voucherNo) {
            // This is a cancelled transfer - redirect to new transfer creation
            // toast.info("This transfer is cancelled. Redirecting to restoration...");
            populateFormFromCancelledTransfer(parsedData.data);
            return;
          // }
        } catch (e) {
          // Ignore parse errors
        }
      }

      toast.error("Transfer not found in active records");
      navigate("/admin/dashboard/income-transfers");
    }
  };

  useEffect(() => {
  // Clear localStorage first
  // localStorage.removeItem("restore_cancelled_transfer");

  // Get query parameters
  // const searchParams = new URLSearchParams(location.search);
  // const cancelledIncomeType = searchParams.get("cancelledIncomeType");

  // SCENARIO 1: We have a voucher number in URL (view/edit existing transfer OR restore cancelled)
 if (voucherNoParam && fiscalYearParam) {
  const voucherNo = parseInt(voucherNoParam);
  const fiscalYear = parseInt(fiscalYearParam);
  if (isNaN(voucherNo) || isNaN(fiscalYear)) {
    toast.error("Invalid voucher number in URL");
    navigate("/admin/dashboard/income-transfers");
    return;
  }

  const locationState = location.state as any;
  const cancelledIncomeType = new URLSearchParams(location.search).get("cancelledIncomeType");

  // 1. Try to get cancelled transfer data from location.state or localStorage
  let cancelledData = null;

  if (locationState?.isRestoringCancelledTransfer && locationState?.cancelledTransferData) {
    cancelledData = locationState.cancelledTransferData;
  } else {
    const localData = localStorage.getItem("restore_cancelled_transfer");
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Optional: check timestamp (e.g., 30 minutes)
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
        if (parsed.timestamp > thirtyMinutesAgo && parsed.data.voucherNo === voucherNo) {
          cancelledData = parsed.data;
        } else {
          localStorage.removeItem("restore_cancelled_transfer");
        }
      } catch (e) {
        localStorage.removeItem("restore_cancelled_transfer");
      }
    }
  }

  if (cancelledData) {
    populateFormFromCancelledTransfer(cancelledData);
    // Refresh localStorage to extend expiry
    localStorage.setItem(
      "restore_cancelled_transfer",
      JSON.stringify({ data: cancelledData, timestamp: Date.now() })
    );
    // Clear location state to avoid stale data on future navigation
    window.history.replaceState({}, document.title);
    return;
  }

  // 2. If the URL explicitly asks for a cancelled transfer but we have no data, error out
  if (cancelledIncomeType === "1") {
    toast.error("Cancelled transfer data not found");
    navigate("/admin/dashboard/income-transfers");
    return;
  }

  // 3. Otherwise, load the active transfer
  loadExistingTransfer(voucherNo, fiscalYear);
}
  // SCENARIO 2: No voucher number - could be new transfer or restoring cancelled
  else {
    const locationState = location.state as any;
    const localStorageData = localStorage.getItem("restore_cancelled_transfer");

    // Priority 1: Check location state (from cancelled transfers page)
    if (
      locationState?.isRestoringCancelledTransfer &&
      locationState?.cancelledTransferData
    ) {
      populateFormFromCancelledTransfer(locationState.cancelledTransferData);
      // Store in localStorage for refresh protection
      localStorage.setItem(
        "restore_cancelled_transfer",
        JSON.stringify({
          data: locationState.cancelledTransferData,
          timestamp: new Date().getTime()
        })
      );
      // Clear location state
      window.history.replaceState({}, document.title);
    }
    // Priority 2: Check localStorage (for page refresh)
    else if (localStorageData) {
      try {
        const parsedData = JSON.parse(localStorageData);
        // Check if data is not too old (e.g., 30 minutes)
        const thirtyMinutesAgo = new Date().getTime() - (30 * 60 * 1000);
        if (parsedData.timestamp > thirtyMinutesAgo) {
          populateFormFromCancelledTransfer(parsedData.data);
        } else {
          localStorage.removeItem("restore_cancelled_transfer");
          clearAll();
        }
      } catch (error) {
        console.error("❌ Error parsing localStorage data:", error);
        localStorage.removeItem("restore_cancelled_transfer");
        clearAll();
      }
    }
    // Priority 3: Brand new transfer
    else {
      // setupBrandNewTransfer();
    }
  }
}, [voucherNoParam, fiscalYearParam, location.state, location.search]);

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
        getIncomeTransfer({voucherNo, fiscalYear: searchFiscalYear}),
      ).unwrap();
      if (result.incomeTransfer) {
        const incomeTransferData = result.incomeTransfer;

        setIsRestoringCancelledTransfer(false);
        setIsNewTransfer(false);
        setIsEditing(true);
        setIsFormEnabled(false);
        // setEditingExchangeId(incomeTransferData.id);
        setDisplayVoucherNo(incomeTransferData.voucherNo);
        setDisplayTransferId(incomeTransferData.id);

        setState({
          id: incomeTransferData.id,
          currencyId: incomeTransferData.currencyId,
          ComSender_ID: incomeTransferData.ComSender_ID,
          HmulafromComSender: incomeTransferData.HmulafromComSender,
          HmulatoComSender: incomeTransferData.HmulatoComSender,

          RecieverPerson: incomeTransferData.RecieverPerson,
          RecieverAddress: incomeTransferData.RecieverAddress,
          RecieverPhone: incomeTransferData.RecieverPhone,
          SenderPerson: incomeTransferData.SenderPerson,
          SenderAddress: incomeTransferData.SenderAddress,
          SenderPhone: incomeTransferData.SenderPhone,
          AmountTransfer: incomeTransferData.AmountTransfer,
          HmulafromReceiver: incomeTransferData.HmulafromReceiver,
          TotalTransferToReceiver: incomeTransferData.TotalTransferToReceiver,
          Notes: incomeTransferData.Notes,
          createdAt: new Date(incomeTransferData.createdAt),
          USER_ID: incomeTransferData.USER_ID,
        });
   setSearchFiscalYear(incomeTransferData.fiscalYear),
        setSenderState({
          accountId: incomeTransferData.ComSender_ID,
          name: incomeTransferData.sender?.name || "",
          phone: incomeTransferData.sender?.phone || "",
          address: incomeTransferData.sender?.address || "",
        });

        setSearchSenderTerm(incomeTransferData.sender?.name || "");
        setCurrencyName(incomeTransferData.currency?.currency || "");
        setSelectedSenderAccount(incomeTransferData.sender || null);

        // onAccountSelect(exchangeData.accountId);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load voucher");
    }
  };

  const handleDateChange = (date: Date | null): void => {
    if (!date) return;

    setState((prev) => ({
      ...prev,
      createdAt: date,
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

  const handleSearchSenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSenderAccount(null);
    setSenderState((prev) => ({ ...prev, phone: "", address: "" }));
    const value = e.target.value;
    setSearchSenderTerm(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = window.setTimeout(() => {
      if (value.trim()) {
        dispatch(searchAccounts({ searchValue: value.trim() }));
        setShowSenderResults(true);
      } else {
        dispatch(clearSearchResults());
        setShowSenderResults(false);
      }
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSenderResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSenderAccount = (account: AccountGet) => {
    setSearchSenderTerm(account.name);
    setSelectedSenderAccount(account);
    setSenderState({
      accountId: account.accountId,
      name: account.name,
      phone: account.phone || "",
      address: account.address || "",
    });
    setShowSenderResults(false);
    dispatch(clearSearchResults());

    setTimeout(() => {
    if (focusNext) {
      focusNext(1);
    }
  }, 100);
  };

  // const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSenderAccountModalOpen, setIsSenderAccountModalOpen] =
    useState(false);

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

  const handleSenderAccountIdDoubleClick = () => {
    setIsSenderAccountModalOpen(true);
    fetchAccountsForModal();
  };

  const handleModalAccountSenderSelect = (account: AccountGet) => {
    const currentCurrencyId = state.currencyId || currencyIdRef.current;
          
          if (!currentCurrencyId) {
            toast.error("Please select a currency first");
            return;
          }
    
    setSenderState({
      accountId: account.accountId,
      name: account.name,
      phone: account.phone || "",
      address: account.address || "",
    });
    setSearchSenderTerm(account.name);
    setSelectedSenderAccount(account);
    setIsSenderAccountModalOpen(false);

    setState(prev => ({
    ...prev,
    accountId: account.accountId
  }));

    onAccountSelect(account.accountId);

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

      const closeModal = () => {
  setIsSenderAccountModalOpen(false);
  setModalSearchTerm('');
};

  const inputHandle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  const {
    onAccountSelect,
    onSave,
    resetBalances,
    // balancePrev,
    // prevText,
    // prevBg,
    // balanceNow,
    // nowText,
    // nowBg,
  } = useAccountBalances(state.currencyId);

  const handleSaveSender = () => {
    if (state.currencyId && senderState.accountId) {
      onSave(senderState.accountId);
    }
  };

  const searchSenderAccountById = async (accountId: number) => {
    try {
       const currentCurrencyId = state.currencyId || currencyIdRef.current;
              
              if (!currentCurrencyId) {
                toast.error("Please select a currency first");
                return;
              }
      
      const result = await dispatch(
        getAccountByAccountId({ accountId: accountId }),
      ).unwrap();

      if (result.account) {
        const account = result.account;
        setSenderState({
          accountId: account.accountId,
          name: account.name,
          phone: account.phone || "",
          address: account.address || "",
        });
        setSearchSenderTerm(account.name);
        setSelectedSenderAccount(account);

        setState(prev => ({
        ...prev,
        accountId: account.accountId
      }));

        onAccountSelect(account.accountId);
      }
    } catch (error) {
      console.error("Failed to search account by ID:", error);
    }
  };



  useEffect(() => {
    const total =
      Math.round(state.AmountTransfer - state.HmulafromReceiver) || 0;
    setState((prevState) => {
      if (prevState.TotalTransferToReceiver === total) {
        return prevState;
      }
      return { ...prevState, TotalTransferToReceiver: total };
    });
  }, [state.AmountTransfer, state.HmulafromReceiver]);

  useEffect(() => {
    const obj = { parPage: 10, page: 1, searchValue: "" };
    dispatch(getAllCurrencies(obj));
  }, []);

  const enableEditMode = () => {
    showConfirmation(t("home.are_you_sure_to_update"), () => {
      setIsFormEnabled(true);
      // setIsEditMode(true);
      setIsEditing(true);
      // setDisplayTransferId(transferId || displayTransferId);
      setIsNewTransfer(false);
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
    if (transferVoucherNo) return parseInt(String(transferVoucherNo));
    return null;
  };

  // Form submission
  const add = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      senderState.accountId,

      state.currencyId,

      state.AmountTransfer,
    ];

    if (requiredFields.some((field) => !field)) {
      toast.error(t("home.fill_fields"));
      return;
    }

    // const createdAt = getCurrentTime();
    if (!user) {
  // Redirect to login or show message
  return <Navigate to="/admin/login" replace />;
}

    const incomeTransferData = {
      cancelledIncomeVoucher: originalCancelledVoucherNo || undefined,
      currencyId: state.currencyId,
      ComSender_ID: senderState.accountId,
      HmulafromComSender: state.HmulafromComSender,
      HmulatoComSender: state.HmulatoComSender,

      RecieverPerson: state.RecieverPerson,
      RecieverAddress: state.SenderAddress,
      RecieverPhone: state.RecieverPhone,
      SenderPerson: state.SenderPerson,
      SenderAddress: state.SenderAddress,
      SenderPhone: state.SenderPhone,
      AmountTransfer: state.AmountTransfer,
      HmulafromReceiver: state.HmulafromReceiver,
      TotalTransferToReceiver: state.TotalTransferToReceiver,
      Notes: state.Notes,
      createdAt: state.createdAt,
      USER_ID: user.id,

      currencyType: currencyName,
      typeId: FORM_TYPES.INCOMETRANSFER,
      type: "حەوالەی هاتوو/حوالة واردة",

      HawalaIncom_ID: accountTypeId.HawalaIncom_ID,
      Hmula_ID: accountTypeId.Hmula_ID,
    };

    if (isRestoringCancelledTransfer || isNewTransfer) {
      await dispatch(createIncomeTransfer(incomeTransferData)).then(() => {
        // setIsFormEnabled(false);
        setIsEditing(false);
        setVoucherSearch("");
        localStorage.removeItem("restore_cancelled_transfer");
         if (originalCancelledVoucherNo !== null) {
          dispatch(deleteCancelledIncomeTransfer({voucherNo:originalCancelledVoucherNo, fiscalYear:searchFiscalYear}));
         }
        setOriginalCancelledVoucherNo(null);
      });
    } else {
      if (isEditing && displayTransferId) {

        const voucherNo = getVoucherNumber();
      if (voucherNo === null) {
        alert("Please provide a voucher number");
        return;
      }
        const updateData: UpdateIncomeTransferData = {
          ...incomeTransferData,
          id: displayTransferId,
          voucherNo: voucherNo,
        };

        await dispatch(updateIncomeTransfer(updateData)).then(() => {
          setIsEditing(false);
          // setIsFormEnabled(false);
          // setIsNewTransfer(true);
        });
      }
    }
  };

  const clearAll = () => {
    setState({
      currencyId: 0,
      ComSender_ID: 0,
      HmulafromComSender: 0,
      HmulatoComSender: 0,
      RecieverPerson: "",
      RecieverAddress: "",
      RecieverPhone: "",
      SenderPerson: "",
      SenderAddress: "",
      SenderPhone: "",
      AmountTransfer: 0,
      HmulafromReceiver: 0,
      TotalTransferToReceiver: 0,
      Notes: "",
      createdAt: getCurrentTime(),
      USER_ID: user?.id || 0,
    });
    setSenderState({
      accountId: 0,
      name: "",
      phone: "",
      address: "",
    });

    setShowSenderResults(false);
    dispatch(clearSearchResults());
    setSearchSenderTerm("");
    setIsFormEnabled(true);
    setIsEditing(false);
    setOriginalCancelledVoucherNo(0);
    setIsRestoringCancelledTransfer(false);
    setIsNewTransfer(true);

    localStorage.removeItem("restore_cancelled_transfer");

    // setEditingExchangeId(null);
    setVoucherSearch("");
    setDisplayVoucherNo("");
    setDisplayTransferId(0);
    setCurrencyName("");
    resetBalances();
     if (voucherNoParam || fiscalYearParam) { 
      navigate("/admin/dashboard/income-transfers");
    }
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      if (!isEditing) {
        

        setDisplayVoucherNo(transferVoucherNo);
        setDisplayTransferId(transferId);
        // setIsFormEnabled(false);
      }
       setIsFormEnabled(false);
      handleSaveSender();
      // clearAll();
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
          <h2 className="text-lg font-medium text-[#5c5a5a]">
            {t("dashboard.Income Transfers")}
          </h2>
        </div>

        <div className="flex w-full flex-col items-center gap-2  pb-3 lg:flex-row lg:justify-end lg:gap-1">
          <div className="flex  items-center gap-2">
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
              className="flex  items-center gap-2 rounded-md bg-primary px-4 py-[4px] text-white hover:bg-darkBlue hover:shadow-lg"
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
              <Link
                to="/admin/dashboard/income-transfer-list"
                className="rounded-md bg-primary px-5 py-[4px] text-white hover:bg-darkBlue hover:shadow-lg"
              >
                {t("sendTransfer.income_transfers")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full rounded-md bg-white px-3">
        <form onSubmit={add}>
          <div className="grid grid-cols-2 items-center justify-between gap-2 border-b pb-2 pt-3 md:grid-cols-2 lg:grid-cols-2">
            <div className="items-center justify-start gap-2 lg:flex">
              <label htmlFor="date">{t("importCarS.import_date")}</label>

              <DatePicker
                selected={state.createdAt}
                onChange={handleDateChange}
                id="date"
                dateFormat="yyyy-MM-dd"
                className="input-field justify-center rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isFormEnabled}
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

              <label htmlFor="transfer_Id">
                {t("sendTransfer.transfer_Id")}
              </label>
              <input
                className="input-field rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={displayTransferId}
                type="text"
                name="transfer_Id"
                id="transfer_Id"
                disabled
              />
            </div>
          </div>

          {/* Currency and Type */}
          <div className="mt-2 flex flex-col gap-2 border-b py-2">
            <div className="grid grid-cols-1 gap-4 px-3 md:grid-cols-2 lg:grid-cols-2">
              <div className="w-full">
                {/* First row*/}
                <div className="grid grid-cols-1 gap-4 px-3 pb-2 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex w-full items-center gap-2">
                    <label
                      htmlFor="currencyId"
                      className="w-2/7 px-[9px] text-sm font-medium lg:w-3/5 lg:px-[4px]"
                    >
                      {t("currencyS.currency_type")}
                    </label>
                    <select
                    data-next-select-currency
                    ref={registerRef(0)}
                      value={state.currencyId || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setState({ ...state, currencyId: value });
                        const selectedIndex = e.target.selectedIndex;
                        const selectedText =
                          e.target.options[selectedIndex]?.text || "";
                        setCurrencyName(selectedText);
                         setTimeout(() => {
    const nextInput = document.querySelector('[data-next-input]') as HTMLElement;
    if (nextInput) nextInput.focus();
  }, 10);
                      }}
                      id="currencyId"
                      className="w-1/2 rounded-md border border-slate-400 bg-[#ffffff] px-3 py-1 text-sm font-medium text-[#000000] focus:border-secondary lg:w-full"
                      required
                      onKeyDown={getKeyDownHandler(0)} 
                      disabled={!isFormEnabled}
                    >
                      <option value="">{t("currencyS.select_currency")}</option>
                      {currencies?.map((currency) => (
                        <option
                          key={currency.id}
                          value={currency.currencyId}
                          className="max-w-2/4 truncate text-right"
                          style={{ direction: "rtl" }}
                          title={currency.currency}
                        >
                          {currency.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex w-full items-center justify-end">
                {isRestoringCancelledTransfer ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                    <div className="flex items-center"></div>
                    <p className=" text-blue-600">
                      {t("sendTransfer.restoring_cancelled_transfered")}{" "}
                      <span className="font-bold">
                        #{originalCancelledVoucherNo}
                      </span>
                      {t("sendTransfer.restoring_info")}
                    </p>
                  </div>
                ) : // )
                //  : isNewTransfer ? (
                //   <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                //   <h2 className="text-md font-medium">Create New Transfer</h2>
                //   </div>
                // ) : (
                //  <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                //     <h2 className="text-md font-bold">View/Edit Transfer</h2>

                //   </div>
                null}
              </div>
            </div>
          </div>
          {/* Sender */}
          <div
            ref={containerRef}
            className="relative grid grid-cols-1 gap-2  p-3 "
          >
            <div className="flex flex-col gap-1">
              <h2>{t("sendTransfer.sender_info")}</h2>
            </div>
            <div className="grid grid-cols-1 justify-between gap-4 border bg-lightGreen p-3 md:grid-cols-2 lg:grid-cols-2">
              <div className="flex flex-col gap-1 pb-2">
                <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-4">
                  <div className="col-span-1 flex flex-col gap-1 pb-2">
                    <label htmlFor="senderId">
                      {t("categoryS.account_id")}
                    </label>

                    <input
                    data-next-input
                    ref={registerRef(1)}
                      className="rounded-md border border-gray-300 px-3 py-[6px] placeholder:text-xs"
                      value={
                        senderState.accountId === 0
                          ? ""
                          : senderState.accountId.toString()
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? 0 : parseInt(value, 10);

                        setSenderState((prev) => ({
                          ...prev,
                          accountId: isNaN(numValue) ? 0 : numValue,
                        }));

                        // Optional: Trigger search when user stops typing
                        if (numValue > 0) {
                          const timeoutId = setTimeout(() => {
                            searchSenderAccountById(numValue);
                          }, 100);

                          return () => clearTimeout(timeoutId);
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        const numValue = parseInt(value, 10);

                        // Validate and fetch account when input loses focus
                        if (!isNaN(numValue) && numValue > 0) {
                          searchSenderAccountById(numValue);
                        }
                      }}
                      onDoubleClick={handleSenderAccountIdDoubleClick}
                      type="text"
                      id="senderId"
                      name="senderId"
                      placeholder={t("sendTransfer.sender_account")}
                      readOnly={!isFormEnabled}
                       onKeyDown={getKeyDownHandler(1)}
                      required
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1 pb-2">
                    <label htmlFor="sender_name">
                      {t("sendTransfer.sender_name")}
                    </label>
                    <input
                      id="sender_name"
                      type="text"
                      className="rounded-md border px-2 py-[6px] placeholder:text-xs"
                      value={searchSenderTerm}
                      onChange={handleSearchSenderChange}
                      placeholder={t("sendTransfer.search_sender_name")}
                      readOnly={!isFormEnabled}
                      onFocus={() => {
                        if (!selectedSenderAccount) setShowSenderResults(true);
                      }}
                    />
                    {!selectedSenderAccount &&
                      searchSenderTerm &&
                      showSenderResults && (
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
                                handleSelectSenderAccount(account);
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
                  <div className="flex flex-col gap-1">
                    <label htmlFor="hmula_to_sender">
                      {t("sendTransfer.hmula_to_sender")}
                    </label>
                    <input
                     ref={registerRef(2)}
                      className="rounded-md border border-gray-300 px-2 py-[6px]"
                      onChange={(e) => {
                        const value = e.target.value;
                        setState({
                          ...state,
                          HmulatoComSender:
                            value === "" ? 0 : parseInt(value) || 0,
                        });
                      }}
                      value={
                        state.HmulatoComSender === 0
                          ? ""
                          : state.HmulatoComSender
                      }
                      type="text"
                      id="hmula_to_sender"
                      name="hmula_to_sender"
                      readOnly={!isFormEnabled}
                      onKeyDown={getKeyDownHandler(2)}
                      // autoComplete="sender_address"
                      // readOnly={!!senderState.accountId}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="hmula_to_sender">
                      {t("sendTransfer.hmula_from_sender_com")}
                    </label>
                    <input
                    ref={registerRef(3)}
                      className="rounded-md border border-gray-300 px-2 py-[6px]"
                      onChange={(e) => {
                        const value = e.target.value;
                        setState({
                          ...state,
                          HmulafromComSender:
                            value === "" ? 0 : parseInt(value) || 0,
                        });
                      }}
                      value={
                        state.HmulafromComSender === 0
                          ? ""
                          : state.HmulafromComSender
                      }
                      type="text"
                      id="hmula_to_sender"
                      name="hmula_to_sender"
                      readOnly={!isFormEnabled}
                      onKeyDown={getKeyDownHandler(3)}
                      // autoComplete="sender_address"
                      // readOnly={!!senderState.accountId}
                    />
                  </div>
                </div>
              </div>
              {/* <div className="flex  justify-end gap-1 bg-slate-400 pb-2"></div> */}
              {/* Balance Section */}
              {/* <div className="flex w-full justify-end  ">
                <div className="grid grid-cols-1 gap-1 bg-slate-200 px-3 py-2  md:grid-cols-1 lg:grid-cols-1">
                  <div className="col-span-2 flex flex-col gap-1 pb-2">
                    <div className="whitespace-nowrap text-sm">
                      {t("currencyS.balance_prev")}
                    </div>

                    <div className="flex w-full flex-row gap-2">
                      <input
                        className="input-field rounded-md border border-gray-300 bg-gray-50 px-2 py-[6px]"
                        value={balancePrev}
                        type="number"
                        name="balance_now"
                        id="balance_now"
                        disabled
                        readOnly
                      />

                      <input
                        className="w-2/5 rounded-md border border-gray-300 px-2 py-[6px] text-sm"
                        style={{ color: nowBg }}
                        value={prevText}
                        type="text"
                        id="accountId2"
                        autoComplete="accountId"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1 py-2">
                    <div className="whitespace-nowrap text-sm">
                      {t("currencyS.balance_now")}
                    </div>

                    <div className="flex w-full flex-row gap-2">
                      <input
                        className="input-field rounded-md border border-gray-300 bg-gray-50 px-2 py-[6px]"
                        value={balanceNow}
                        type="number"
                        name="balance_prev"
                        id="balance_prev"
                        disabled
                        readOnly
                      />

                      <input
                        className="w-2/5 rounded-md border border-gray-300 px-2 py-[6px] text-sm "
                        style={{ color: prevBg }}
                        value={balanceNow ? nowText : ""}
                        type="text"
                        id="accountId2"
                        autoComplete="accountId"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>

          {/* Sender & Receiver Person */}
          <div
            ref={containerRef}
            className="relative grid grid-cols-1 gap-2  px-3 "
          >
            {/* <div className="flex flex-col gap-1">
              <h2>{t("home.account_info")}</h2>
            </div> */}
            <div className="mb-6 grid grid-cols-1 justify-start gap-2 border ">
              <div className="grid grid-cols-2 justify-between gap-4 bg-lightGreen px-4 py-2 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-2 items-center gap-2 lg:flex">
                  <label className="w-36" htmlFor="SenderPerson">
                    {t("sendTransfer.sender_person")}
                  </label>
                  <input
                  ref={registerRef(4)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.SenderPerson || ""}
                    onChange={inputHandle}
                    type="text"
                    id="SenderPerson"
                    name="SenderPerson"
                    readOnly={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(4)}
                    // autoComplete="sender_person"
                    // readOnly={!!senderState.accountId}
                  />
                </div>
                <div className="col-span-2 items-center gap-2 lg:flex">
                  <label htmlFor="SenderAddress">
                    {t("currencyS.address")}
                  </label>
                  <input
                  ref={registerRef(5)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.SenderAddress || ""}
                    onChange={inputHandle}
                    type="text"
                    id="SenderAddress"
                    name="SenderAddress"
                    readOnly={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(5)}
                    // autoComplete="SenderAddress"
                    // readOnly={!!senderState.accountId}
                  />
                </div>

                <div className="items-center gap-2  lg:flex">
                  <label htmlFor="SenderPhone">{t("customerS.phone")}</label>
                  <input
                   ref={registerRef(6)}
                    className="rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.SenderPhone || ""}
                    onChange={inputHandle}
                    type="text"
                    id="SenderPhone"
                    name="SenderPhone"
                    readOnly={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(6)}
                    // autoComplete="sender_phone"
                    // readOnly={!!senderState.accountId}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 justify-between gap-4 bg-lightBlue px-4 py-2 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-2 items-center gap-2 lg:flex">
                  <label className="w-36" htmlFor="RecieverPerson">
                    {t("sendTransfer.receiver_person")}
                  </label>
                  <input
                   ref={registerRef(7)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.RecieverPerson || ""}
                    onChange={inputHandle}
                    type="text"
                    id="RecieverPerson"
                    name="RecieverPerson"
                    readOnly={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(7)}
                    // autoComplete="receiver_person"
                    // readOnly={!!senderState.accountId}
                  />
                </div>
                <div className="col-span-2 items-center gap-2 lg:flex">
                  <label htmlFor="RecieverAddress">
                    {t("currencyS.address")}
                  </label>
                  <input
                  ref={registerRef(8)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.RecieverAddress || ""}
                    onChange={inputHandle}
                    type="text"
                    id="RecieverAddress"
                    name="RecieverAddress"
                    readOnly={!isFormEnabled}
                      onKeyDown={getKeyDownHandler(8)}
                    // autoComplete="receiver_address"
                    // readOnly={!!senderState.accountId}
                  />
                </div>

                <div className="items-center gap-2  lg:flex">
                  <label htmlFor="RecieverPhone">{t("customerS.phone")}</label>
                  <input
                  ref={registerRef(9)}
                    className="rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.RecieverPhone || ""}
                    onChange={inputHandle}
                    type="text"
                    id="RecieverPhone"
                    name="RecieverPhone"
                    readOnly={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(9)}
                    // autoComplete="receiver_phone"
                    // readOnly={!!senderState.accountId}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 px-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="flex flex-col gap-1">
              <label htmlFor="AmountTransfer">
                {t("sendTransfer.received_transfer")}
              </label>
              <input
               ref={registerRef(10)}
                className="input-field rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const value = e.target.value;
                  setState({
                    ...state,
                    AmountTransfer: value === "" ? 0 : parseFloat(value) || 0,
                  });
                }}
                value={state.AmountTransfer === 0 ? "" : state.AmountTransfer}
                type="number"
                name="AmountTransfer"
                id="AmountTransfer"
                min={0}
                required
                disabled={!isFormEnabled}
                 onKeyDown={getKeyDownHandler(10)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="HmulafromReceiver">
                {t("sendTransfer.hmula_from_receiver")}
              </label>
              <input
                ref={registerRef(11)}
                className="input-field rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const value = e.target.value;
                  setState({
                    ...state,
                    HmulafromReceiver:
                      value === "" ? 0 : parseFloat(value) || 0,
                  });
                }}
                value={
                  state.HmulafromReceiver === 0 ? "" : state.HmulafromReceiver
                }
                type="number"
                name="HmulafromReceiver"
                id="HmulafromReceiver"
                min={0}
                // required
                disabled={!isFormEnabled}
                onKeyDown={getKeyDownHandler(11)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="totalAmount">
                {t("sendTransfer.amount_paid")}
              </label>
              <input
                className="input-field rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="number"
                name="totalAmount"
                id="totalAmount"
                value={state.TotalTransferToReceiver}
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 px-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="Notes">{t("currencyS.note")}</label>
              <textarea
                ref={registerRef(12)}
                className="input-field rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
    inputHandle(e); 
  
  }}
                value={state.Notes}
                name="Notes"
                id="Notes"
                disabled={!isFormEnabled}
                onKeyDown={getKeyDownHandler(12)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mb-4 mt-8 flex flex-col items-center gap-2 md:flex-row">
            
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
        {/* Account Sender Selection Modal */}
        <AccountSelectionModal
                        isOpen={isSenderAccountModalOpen}
                        onClose={closeModal}
                        title={t("home.select_account")}
                        searchPlaceholder={t("currencyS.search_customer_name")}
                        searchValue={modalSearchTerm}
                        onSearchChange={handleModalSearch}
                        accounts={accountsList}
                        loading={modalLoading}
                        onAccountSelect={handleModalAccountSenderSelect}
                        noAccountsMessage={t("home.no_accounts_found")}
                        accountIdColumnText={t("categoryS.account_id")}
                        accountNameColumnText={t("categoryS.account_name")}
                        cancelButtonText={t("home.cancel")}
                      />
        {/* {isSenderAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-11/12 max-w-4xl rounded-lg bg-white px-6 py-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-md font-bold text-gray-800">
                  {t("home.select_account")}
                </h2>
                <button
                  onClick={() => setIsSenderAccountModalOpen(false)}
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
                              onClick={() =>
                                handleModalAccountSenderSelect(account)
                              }
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
                  onClick={() => setIsSenderAccountModalOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded bg-red-500 px-3 py-[4px] font-medium text-white hover:bg-gray-600 hover:text-white disabled:opacity-75 md:w-auto"
                >
                  {t("home.cancel")}
                </button>
              </div>
            </div>
          </div>
        )} */}
      </div>
      {renderConfirmationModal()}
    </div>
  );
};

export default IncomeTransfers;
