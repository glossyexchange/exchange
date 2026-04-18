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
  createTransfer,
  deleteCancelledSendTransfer,
  getSendTransfer,
  messageClear,
  updateSendTransfer
} from "@/store/Reducers/sendTransferReducer";
import { RootState } from "@/store/rootReducers";
import { AccountGet } from "@/types/accountTypes";
import { FORM_TYPES } from "@/types/formTypes";
import {
  SendTransferState,
  UpdateSendTransferData,
} from "@/types/sendTransferTypes";
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
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { PropagateLoader } from "react-spinners";
import { getCurrentTime } from "../../utils/timeConvertor";
import { accountTypeId, overrideStyle } from "../../utils/utils";
import { useConfirmation } from "../auth/useConfirmation";

const SendTransfer: React.FC = () => {
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
  const { user } = useAuth();

  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const nextInputRef = useRef<HTMLInputElement>(null);

  const { registerRef, getKeyDownHandler, getChangeHandler, focusNext } =
    useInputFocusManager(16, {
      buttonRef: submitButtonRef,
      autoFocusOnChange: true,
      textareaNavigation: "ctrl-enter",
    });

  const TransferTypes = [
    { id: 1, type: t("sendTransfer.cash") },
    { id: 2, type: t("sendTransfer.debit") },
  ];

  const { currencies } = useSelector((state: RootState) => state.currency);

  const {
    successMessage,
    errorMessage,
    loader,
    transferVoucherNo,
    transferId,
  } = useSelector((state: RootState) => state.sendTransfer);
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

  const [searchReceiverTerm, setSearchReceiverTerm] = useState("");
  const [selectedReceiverAccount, setSelectedReceiverAccount] =
    useState<any>(null);
  const [showReceiverResults, setShowReceiverResults] = useState(false);
  // const [firstPayDate, setFirstPayDate] = useState<Date>(new Date());
  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [senderState, setSenderState] = useState<AccountGet>({
    accountId: 0,
    name: "",
    phone: "",
    address: "",
  });

  const [receiverState, setReceiverState] = useState<AccountGet>({
    accountId: 0,
    name: "",
    phone: "",
    address: "",
  });

  const [state, setState] = useState<SendTransferState>({
    id: 0,
    currencyId: 0,
    ComSender_ID: 0,
    HmulafromComSender: 0,
    ComeReciever_ID: 0,
    HmulafromComReciever: 0,
    HmulatoComReciever: 0,
    RecieverPerson: "",
    RecieverAddress: "",
    RecieverPhone: "",
    SenderPerson: "",
    SenderAddress: "",
    SenderPhone: "",
    AmountTransfer: 0,
    HmulatoComSender: 0,
    TotalTransferToReceiver: 0,
    Notes: "",
    createdAt: getCurrentTime(),
USER_ID: user?.id || 0,
    transferTypeId: 0,
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
    setOriginalCancelledVoucherNo(cancelledData.voucherNo);
    setDisplayVoucherNo(""); //
    setDisplayTransferId(0);
    // setEditingExchangeId(null);

    // Populate all form fields WITHOUT the voucher number
    setState({
      id: 0, // Always 0 for new transfer
      currencyId: Number(cancelledData.currencyId) || 0,
      ComSender_ID: Number(cancelledData.comSenderId) || 0,
      HmulafromComSender: Number(cancelledData.hmulaFromComSender) || 0,
      ComeReciever_ID: Number(cancelledData.comReceiverId) || 0,
      HmulafromComReciever: Number(cancelledData.hmulaFromComReceiver) || 0,
      HmulatoComReciever: Number(cancelledData.hmulaToComReceiver) || 0,
      RecieverPerson:
        cancelledData.recieverPerson || cancelledData.receiver?.name || "",
      RecieverAddress:
        cancelledData.recieverAddress || cancelledData.receiver?.address || "",
      RecieverPhone:
        cancelledData.recieverPhone || cancelledData.receiver?.phone || "",
      SenderPerson:
        cancelledData.senderPerson || cancelledData.sender?.name || "",
      SenderAddress:
        cancelledData.senderAddress || cancelledData.sender?.address || "",
      SenderPhone:
        cancelledData.senderPhone || cancelledData.sender?.phone || "",
      AmountTransfer: Number(cancelledData.amountTransfer) || 0,
      HmulatoComSender: Number(cancelledData.hmulaToComSender) || 0,
      TotalTransferToReceiver: Number(cancelledData.totalTransferToReceiver) || 0,
      Notes: `Restored from cancelled transfer #${cancelledData.voucherNo}\n${
        cancelledData.Notes || ""
      }`,
      createdAt: new Date(), // Current date for new transfer
      USER_ID: cancelledData.userId || user?.id,
      transferTypeId: cancelledData.transferTypeId || 1,
      
    });
setSearchFiscalYear(cancelledData.fiscalYear),
    setSenderState({
      accountId: cancelledData.comSenderId,
      name: cancelledData.sender?.name || "",
      phone: cancelledData.sender?.phone || "",
      address: cancelledData.sender?.address || "",
    });
    setReceiverState({
      accountId: cancelledData.comReceiverId,
      name: cancelledData.receiver?.name || "",
      phone: cancelledData.receiver?.phone || "",
      address: cancelledData.receiver?.address || "",
    });

    setSearchSenderTerm(
      cancelledData.sender?.name || cancelledData.SenderPerson || "",
    );
    setSearchReceiverTerm(
      cancelledData.receiver?.name || cancelledData.RecieverPerson || "",
    );
    setCurrencyName(cancelledData.currency?.currency || "");
    setSelectedSenderAccount(cancelledData.sender || null);
    setSelectedReceiverAccount(cancelledData.receiver || null);
  };

  // Function 2: Populate form for viewing/editing existing active transfer
  const populateFormForExistingTransfer = (sendTransferData: any) => {
    setIsRestoringCancelledTransfer(false);
    setIsNewTransfer(false);
    setIsEditing(false); // Start in view mode
    setIsFormEnabled(false); // Disabled for viewing, enable when edit button clicked
    // setEditingExchangeId(sendTransferData.id);
    setDisplayVoucherNo(sendTransferData.voucherNo);
    setDisplayTransferId(sendTransferData.id);

    setState({
      id: sendTransferData.id,
      currencyId: Number(sendTransferData.currencyId) || 0,
  ComSender_ID: Number(sendTransferData.ComSender_ID) || 0,
  HmulafromComSender: Number(sendTransferData.HmulafromComSender) || 0,
  ComeReciever_ID: Number(sendTransferData.ComeReciever_ID) || 0,
  HmulafromComReciever: Number(sendTransferData.HmulafromComReciever) || 0,
  HmulatoComReciever: Number(sendTransferData.HmulatoComReciever) || 0,
      RecieverPerson: sendTransferData.RecieverPerson || "",
      RecieverAddress: sendTransferData.RecieverAddress || "",
      RecieverPhone: sendTransferData.RecieverPhone || "",
      SenderPerson: sendTransferData.SenderPerson || "",
      SenderAddress: sendTransferData.SenderAddress || "",
      SenderPhone: sendTransferData.SenderPhone || "",
      AmountTransfer: Number(sendTransferData.AmountTransfer) || 0,
  HmulatoComSender: Number(sendTransferData.HmulatoComSender) || 0,
  TotalTransferToReceiver: Number(sendTransferData.TotalTransferToReceiver) || 0,
      Notes: sendTransferData.Notes || "",
      createdAt: new Date(sendTransferData.createdAt),
      USER_ID: sendTransferData.USER_ID,
      transferTypeId: sendTransferData.transferTypeId,
    });

    setSenderState({
      accountId: sendTransferData.ComSender_ID,
      name:
        sendTransferData.sender?.name || sendTransferData.SenderPerson || "",
      phone:
        sendTransferData.sender?.phone || sendTransferData.SenderPhone || "",
      address:
        sendTransferData.sender?.address ||
        sendTransferData.SenderAddress ||
        "",
    });
    setReceiverState({
      accountId: sendTransferData.ComeReciever_ID,
      name:
        sendTransferData.receiver?.name ||
        sendTransferData.RecieverPerson ||
        "",
      phone:
        sendTransferData.receiver?.phone ||
        sendTransferData.RecieverPhone ||
        "",
      address:
        sendTransferData.receiver?.address ||
        sendTransferData.RecieverAddress ||
        "",
    });

    setSearchSenderTerm(
      sendTransferData.sender?.name || sendTransferData.SenderPerson || "",
    );
    setCurrencyName(sendTransferData.currency?.currency || "");
    setSelectedSenderAccount(sendTransferData.sender || null);
    setSearchReceiverTerm(
      sendTransferData.receiver?.name || sendTransferData.RecieverPerson || "",
    );
    setSelectedReceiverAccount(sendTransferData.receiver || null);
  };

  // Function 4: Load existing transfer from API
  const loadExistingTransfer = async (voucherNo: number, fiscalYear:number) => {
    try {
      const result = await dispatch(
        getSendTransfer({voucherNo, fiscalYear}),
      ).unwrap();

    
      

      if (result.sendTransfer) {
        populateFormForExistingTransfer(result.sendTransfer);
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
           
            populateFormFromCancelledTransfer(parsedData.data);
            return;
          // }
        } catch (e) {
          // Ignore parse errors
        }
      }

      toast.error("Transfer not found in active records");
      navigate("/admin/dashboard/send-transfer");
    }
  };

  useEffect(() => {
    // localStorage.removeItem("restore_cancelled_transfer");

    // SCENARIO 1: We have a voucher number in URL (view/edit existing transfer)
    if (voucherNoParam && fiscalYearParam) {
    const voucherNo = parseInt(voucherNoParam);
    const fiscalYear = parseInt(fiscalYearParam);

    

    if (isNaN(voucherNo) || isNaN(fiscalYear)) {
        toast.error("Invalid voucher number in URL");
        navigate("/admin/dashboard/send-transfer");
        return;
      }

      loadExistingTransfer(voucherNo, fiscalYear);
    }
    // SCENARIO 2: No voucher number - could be new transfer or restoring cancelled
    else {
      const locationState = location.state as any;
      const localStorageData = localStorage.getItem(
        "restore_cancelled_transfer",
      );

      // Priority 1: Check location state (from cancelled transfers page)
      if (
        locationState?.isRestoringCancelledTransfer &&
        locationState?.cancelledTransferData
      ) {
        
        populateFormFromCancelledTransfer(locationState.cancelledTransferData);
        // Clear location state to avoid restoring on refresh
        window.history.replaceState({}, document.title);
      }
      // Priority 2: Check localStorage (for page refresh)
      else if (localStorageData) {
        try {
          const parsedData = JSON.parse(localStorageData);
           console.log("result3", parsedData);
          populateFormFromCancelledTransfer(parsedData.data);
        } catch (error) {
          console.error("❌ Error parsing localStorage data:", error);
          localStorage.removeItem("restore_cancelled_transfer");
          clearAll();
        }
      }
      // Priority 3: Brand new transfer
      else {
        console.log("🆕 Creating brand new transfer");
        // setupBrandNewTransfer();
      }
    }
  }, [voucherNoParam, fiscalYearParam,location.state, dispatch, navigate]);

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
        getSendTransfer({voucherNo, fiscalYear: searchFiscalYear}),
      ).unwrap();
      if (result.sendTransfer) {
        const sendTransferData = result.sendTransfer;
        setIsEditing(false);
        setIsFormEnabled(false);
        // setEditingExchangeId(sendTransferData.id);
        setDisplayVoucherNo(voucherNo);
        setDisplayTransferId(sendTransferData.id);
        setState({
          id: sendTransferData.id,
          currencyId: Number(sendTransferData.currencyId),
  ComSender_ID: Number(sendTransferData.ComSender_ID),
  HmulafromComSender: Number(sendTransferData.HmulafromComSender),
  ComeReciever_ID: Number(sendTransferData.ComeReciever_ID),
  HmulafromComReciever: Number(sendTransferData.HmulafromComReciever),
  HmulatoComReciever: Number(sendTransferData.HmulatoComReciever),
          RecieverPerson: sendTransferData.RecieverPerson,
          RecieverAddress: sendTransferData.RecieverAddress,
          RecieverPhone: sendTransferData.RecieverPhone,
          SenderPerson: sendTransferData.SenderPerson,
          SenderAddress: sendTransferData.SenderAddress,
          SenderPhone: sendTransferData.SenderPhone,
          AmountTransfer: Number(sendTransferData.AmountTransfer),
          HmulatoComSender: Number(sendTransferData.HmulatoComSender),
          TotalTransferToReceiver: Number(sendTransferData.TotalTransferToReceiver),
          Notes: sendTransferData.Notes,
          createdAt: new Date(sendTransferData.createdAt),
          USER_ID: sendTransferData.USER_ID,
          transferTypeId: sendTransferData.transferTypeId,
        });
        setSearchFiscalYear(sendTransferData.fiscalYear),

        setSenderState({
          accountId: sendTransferData.ComSender_ID,
          name: sendTransferData.sender?.name || "",
          phone: sendTransferData.sender?.phone || "",
          address: sendTransferData.sender?.address || "",
        });
        setReceiverState({
          accountId: sendTransferData.ComeReciever_ID,
          name: sendTransferData.receiver?.name || "",
          phone: sendTransferData.receiver?.phone || "",
          address: sendTransferData.receiver?.address || "",
        });

        setSearchSenderTerm(sendTransferData.sender?.name || "");
        setCurrencyName(sendTransferData.currency?.currency || "");
        setSelectedSenderAccount(sendTransferData.sender || null);
        setDisplayTransferId(sendTransferData.id);
        setSearchReceiverTerm(sendTransferData.receiver?.name || "");
        setSelectedReceiverAccount(sendTransferData.receiver || null);
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
      const nextInput = document.querySelector(
        "[data-next-select-currency]",
      ) as HTMLElement;
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

  const handleSearchRecieverChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSelectedReceiverAccount(null);
    setReceiverState((prev) => ({ ...prev, phone: "", address: "" }));
    const value = e.target.value;
    setSearchReceiverTerm(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = window.setTimeout(() => {
      if (value.trim()) {
        dispatch(searchAccounts({ searchValue: value.trim() }));
        setShowReceiverResults(true);
      } else {
        dispatch(clearSearchResults());
        setShowReceiverResults(false);
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
        setShowReceiverResults(false);
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
        focusNext(2);
      }
    }, 100);
  };

  const handleSelectRecieverAccount = (account: AccountGet) => {
    setSearchReceiverTerm(account.name);
    setSelectedReceiverAccount(account);
    setReceiverState({
      accountId: account.accountId,
      name: account.name,
      phone: account.phone || "",
      address: account.address || "",
    });
    setShowReceiverResults(false);
    dispatch(clearSearchResults());

    setTimeout(() => {
      if (focusNext) {
        focusNext(4);
      }
    }, 100);
  };

  // const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSenderAccountModalOpen, setIsSenderAccountModalOpen] =
    useState(false);
  const [isReceiverAccountModalOpen, setIsReceiverAccountModalOpen] =
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

  const handleReceiverAccountIdDoubleClick = () => {
    setIsReceiverAccountModalOpen(true);
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

    setState((prev) => ({
      ...prev,
      accountId: account.accountId,
    }));

    onAccountSelect(account.accountId);

    setTimeout(() => {
      if (focusNext) {
        focusNext(2);
      }
    }, 100);
  };

  const handleModalAccountRecieverSelect = (account: AccountGet) => {
    setReceiverState({
      accountId: account.accountId,
      name: account.name,
      phone: account.phone || "",
      address: account.address || "",
    });
    setSearchReceiverTerm(account.name);
    setSelectedReceiverAccount(account);
    setIsReceiverAccountModalOpen(false);

    setState((prev) => ({
      ...prev,
      accountId: account.accountId,
    }));

    onAccountSelect(account.accountId);

    setTimeout(() => {
      if (focusNext) {
        focusNext(4);
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

  const closeSenderModal = () => {
    setIsSenderAccountModalOpen(false);
    setModalSearchTerm("");
  };

  const closeReceiverModal = () => {
    setIsReceiverAccountModalOpen(false);
    setModalSearchTerm("");
  };

const numericFields = [
  'currencyId',
  'ComSender_ID',
  'HmulafromComSender',
  'ComeReciever_ID',
  'HmulafromComReciever',
  'HmulatoComReciever',
  'AmountTransfer',
  'HmulatoComSender',
  'TotalTransferToReceiver',
  'transferTypeId',
];

const inputHandle = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  const { name, value } = e.target;
  setState((prev) => ({
    ...prev,
    [name]: numericFields.includes(name)
      ? value === ''
        ? 0
        : Number(value)
      : value,
  }));
};

  // const inputHandle = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  // ) => {
  //   const { name, value } = e.target;
  //   setState((prev) => ({ ...prev, [name]: value }));
  // };

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

      setTimeout(async () => {
        // Focus
        if (focusNext) {
          focusNext(5);
        }
      }, 800);
    }
  };

  const handleSaveReciever = () => {
    if (state.currencyId && receiverState.accountId) {
      onSave(receiverState.accountId);
      setTimeout(async () => {
        // Focus
        if (focusNext) {
          focusNext(5);
        }
      }, 800);
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

        setState((prev) => ({
          ...prev,
          accountId: account.accountId,
        }));

        onAccountSelect(account.accountId);
      }
    } catch (error) {
      console.error("Failed to search account by ID:", error);
      //    setSenderState(prev => ({
      //   ...prev,
      //   name: "", // Clear name if account not found
      // }));
    }
  };

  const searchRecieverAccountById = async (accountId: number) => {
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
        setReceiverState({
          accountId: account.accountId,
          name: account.name,
          phone: account.phone || "",
          address: account.address || "",
        });
        setSearchReceiverTerm(account.name);
        setSelectedReceiverAccount(account);

        setState((prev) => ({
          ...prev,
          accountId: account.accountId,
        }));

        onAccountSelect(account.accountId);
      }
    } catch (error) {
      console.error("Failed to search account by ID:", error);
    }
  };

  const handleTransferTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = parseInt(e.target.value) || 0;
    const selectedTransfer = TransferTypes.find(
      (transferType) => transferType.id === value,
    );

    if (selectedTransfer) {
      const newState = {
        ...state,
        transferTypeId: value,
      };

      setState(newState);

      // If transfer type is 1 (cash), set accountId to 100
      if (selectedTransfer.id === 1) {
        setSenderState((prev) => ({
          ...prev,
          accountId: 100,
        }));

        // IMPORTANT: Fetch account details for accountId 100
        searchSenderAccountById(100);
      } else {
        // Clear accountId for other transfer types (optional)
        setSenderState((prev) => ({
          ...prev,
          accountId: 0,
          name: "",
        }));
        setSearchSenderTerm("")
      }
    }

    setTimeout(() => {
      const nextInput = document.querySelector(
        "[data-next-input]",
      ) as HTMLElement;
      if (nextInput) nextInput.focus();
    }, 10);
  };

  
  useEffect(() => {
    const total =
      Math.round(state.AmountTransfer + state.HmulafromComSender) || 0;
    setState((prevState) => {
      if (prevState.TotalTransferToReceiver === total) {
        return prevState;
      }
      return { ...prevState, TotalTransferToReceiver: total };
    });
  }, [state.AmountTransfer, state.HmulafromComSender]);

  useEffect(() => {
    const obj = { parPage: 10, page: 1, searchValue: "" };
    dispatch(getAllCurrencies(obj));
  }, []);

  const enableEditMode = () => {
    showConfirmation(t("home.are_you_sure_to_update"), () => {
      setIsFormEnabled(true);
      // setIsEditMode(true);
      setIsEditing(true);
      // setEditingExchangeId(transferId);
      setIsNewTransfer(false);
    });
  };

  const handleClearWithConfirmation = () => {
    showConfirmation(t("home.are_you_sure_to_clear"), () => {
      clearAll();
    });
  };

  // Form submission
  const add = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      senderState.accountId,
      receiverState.accountId,
      state.transferTypeId,
      state.currencyId,

      state.AmountTransfer,
    ];

    if (requiredFields.some((field) => !field)) {
      toast.error(t("home.fill_fields"));
      return;
    }

    // const createdAt = getCurrentTime();

    const sendTransferData = {
      currencyId: state.currencyId,
      ComSender_ID: senderState.accountId,
      HmulafromComSender: state.HmulafromComSender,
      ComeReciever_ID: receiverState.accountId,
      HmulafromComReciever: state.HmulafromComReciever,
      HmulatoComReciever: state.HmulatoComReciever,
      RecieverPerson: state.RecieverPerson,
      RecieverAddress: state.SenderAddress,
      RecieverPhone: state.RecieverPhone,
      SenderPerson: state.SenderPerson,
      SenderAddress: state.SenderAddress,
      SenderPhone: state.SenderPhone,
      AmountTransfer: state.AmountTransfer,
      HmulatoComSender: state.HmulatoComSender,
      TotalTransferToReceiver: state.TotalTransferToReceiver,
      Notes: state.Notes,
      createdAt: state.createdAt,
      USER_ID: user?.id || 0,
      transferTypeId: state.transferTypeId,

      currencyType: currencyName,
      // receiptNo: 0,
      typeId: FORM_TYPES.SENDTRANSFER,
      typeReceiptId: FORM_TYPES.SENDTRANSFER,
      type:"حەوالە ناردن/حوالة صادرة",
      debtorId: senderState.accountId,
      Hmula_ID: accountTypeId.Hmula_ID,
    };

    if (isRestoringCancelledTransfer || isNewTransfer) {
      await dispatch(createTransfer(sendTransferData)).then(() => {
        // setIsFormEnabled(false);
        setIsEditing(false);
        setVoucherSearch("");
          
        localStorage.removeItem("restore_cancelled_transfer");
        if (originalCancelledVoucherNo !== null && searchFiscalYear!=undefined) {
          dispatch(
            deleteCancelledSendTransfer({voucherNo:originalCancelledVoucherNo, fiscalYear:searchFiscalYear}),
          );
        }
        setOriginalCancelledVoucherNo(null);
      });
    } else {
      if (isEditing && displayTransferId) {
        const updateData: UpdateSendTransferData = {
          ...sendTransferData,
          id: displayTransferId,
          voucherNo: parseInt(
            voucherNoParam || voucherSearch || String(displayVoucherNo),
          ),
        };
        await dispatch(updateSendTransfer(updateData)).then(() => {
          // setIsFormEnabled(true);
          // setIsEditMode(false);

          setIsEditing(false);
          // setIsFormEnabled(false);
        });
      }
    }
  };

  const clearAll = () => {
    setState({
      currencyId: 0,
      ComSender_ID: 0,
      HmulafromComSender: 0,
      ComeReciever_ID: 0,
      HmulafromComReciever: 0,
      HmulatoComReciever: 0,
      RecieverPerson: "",
      RecieverAddress: "",
      RecieverPhone: "",
      SenderPerson: "",
      SenderAddress: "",
      SenderPhone: "",
      AmountTransfer: 0,
      HmulatoComSender: 0,
      TotalTransferToReceiver: 0,
      Notes: "",
      createdAt: getCurrentTime(),
      USER_ID: user?.id || 0,
      transferTypeId: 0,
    });
    setSenderState({
      accountId: 0,
      name: "",
      phone: "",
      address: "",
    });
    setReceiverState({
      accountId: 0,
      name: "",
      phone: "",
      address: "",
    });
    setShowSenderResults(false);
    setShowReceiverResults(false);
    dispatch(clearSearchResults());
    setSearchSenderTerm("");
    setSearchReceiverTerm("");
    // setIsEditMode(false);
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
      navigate("/admin/dashboard/send-transfer");
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
      handleSaveSender();
      handleSaveReciever();
       setIsFormEnabled(false);
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
            {t("dashboard.Send Transfer")}
          </h2>
        </div>

        <div className="flex w-full flex-col items-center gap-2 pb-3 lg:flex-row lg:justify-end lg:gap-1">
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
                to="/admin/dashboard/send-transfer-list"
                className="rounded-md bg-primary px-5 py-[4px] text-white hover:bg-darkBlue hover:shadow-lg"
              >
                {t("dashboard.Send Transfer List")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full rounded-md bg-white px-3">
        <form onSubmit={add}>
          <div className="grid grid-cols-2 items-center justify-between gap-2 border-b pb-2 pt-3  md:grid-cols-2 lg:grid-cols-2">
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
                          const nextInput = document.querySelector(
                            "[data-next-select]",
                          ) as HTMLElement;
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

                {/* Second row */}
                <div className="grid grid-cols-1 gap-4 px-3 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex w-full items-center gap-2">
                    <label
                      htmlFor="transfer_type"
                      className="w-2/7 text-sm font-medium lg:w-3/5"
                    >
                      {t("sendTransfer.transfer_type")}
                    </label>
                    <select
                      data-next-select
                      ref={registerRef(1)}
                      value={state.transferTypeId}
                      onChange={handleTransferTypeChange}
                      id="transfer_type"
                      className="w-1/2 rounded-md border border-slate-400 bg-[#ffffff] px-2 py-1 text-sm font-medium text-[#000000] focus:border-secondary lg:w-full"
                      onKeyDown={getKeyDownHandler(1)}
                      required
                      disabled={!isFormEnabled}
                    >
                      <option value="">
                        {t("sendTransfer.select_transfer_type")}
                      </option>
                      {TransferTypes.map((transferType) => (
                        <option key={transferType.id} value={transferType.id}>
                          {transferType.type}
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
                    {/* <input
                      data-next-input
                      ref={registerRef(2)}
                      className={`rounded-md border ${
                        state.transferTypeId === 1 &&
                        senderState.accountId !== 100
                          ? "border-red-500"
                          : "border-gray-300"
                      } px-3 py-[6px] placeholder:text-xs`}
                      value={
                        // When transfer type is 1 (cash), always show 100
                        state.transferTypeId === 1
                          ? "100"
                          : senderState.accountId === 0
                          ? ""
                          : senderState.accountId.toString()
                      }
                      onChange={(e) => {
                        // Only allow changes if transfer type is not 1 (not cash)
                        if (state.transferTypeId !== 1) {
                          const value = e.target.value;
                          const numValue =
                            value === "" ? 0 : parseInt(value, 10);

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
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        const numValue = parseInt(value, 10);

                        // Validate based on transfer type
                        if (state.transferTypeId === 1) {
                          // When transfer type is cash, accountId must be 100
                          if (numValue !== 100) {
                            // Show validation error (you can use state or toast)
                            console.error(
                              "For cash transfer, account ID must be 100",
                            );
                         
                            // Optionally set accountId back to 100
                            setSenderState((prev) => ({
                              ...prev,
                              accountId: 100,
                            }));
                          }
                        } else {
                          // For non-cash transfers, validate normally
                          if (!isNaN(numValue) && numValue > 0) {
                            searchSenderAccountById(numValue);
                          }
                        }
                      }}
                      onDoubleClick={handleSenderAccountIdDoubleClick}
                      type="text"
                      id="senderId"
                      name="senderId"
                      placeholder={t("sendTransfer.sender_account")}
                      onKeyDown={getKeyDownHandler(2)}
                      readOnly={!isFormEnabled || state.transferTypeId === 1}
                      required
                    /> */}

                    <input
                      data-next-input
                      ref={registerRef(2)}
                      className="rounded-md border border-gray-300 px-3 py-[6px] placeholder:text-xs"
                      value={
                        senderState.accountId === 0
                          ? ""
                          : senderState.accountId.toString()
                      }
                      onChange={(e) => {
                        if (state.transferTypeId !== 1) {
                          const value = e.target.value;
                          const numValue =
                            value === "" ? 0 : parseInt(value, 10);

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
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        const numValue = parseInt(value, 10);

                        if (!isNaN(numValue) && numValue > 0) {
                          searchSenderAccountById(numValue);
                        }
                      }}
                      // Conditional onDoubleClick handler
                      onDoubleClick={
                        state.transferTypeId !== 1
                          ? handleSenderAccountIdDoubleClick
                          : undefined
                      }
                      type="text"
                      id="senderId"
                      name="senderId"
                      placeholder={t("sendTransfer.sender_account")}
                      onKeyDown={getKeyDownHandler(2)}
                      readOnly={!isFormEnabled || state.transferTypeId === 1}
                      required
                    />
                    {/* <input
                    data-next-input
                    ref={registerRef(2)}
                      className="rounded-md border border-gray-300 px-3 py-[6px] placeholder:text-xs"
                      value={
                        senderState.accountId === 0
                          ? ""
                          : senderState.accountId.toString()
                      }
                      onChange={(e) => {
                        if (state.transferTypeId !== 1) {
                          const value = e.target.value;
                          const numValue =
                            value === "" ? 0 : parseInt(value, 10);

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
                          }}
                        
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        const numValue = parseInt(value, 10);

            
                        if (!isNaN(numValue) && numValue > 0) {
                          searchSenderAccountById(numValue);
                        }
                      }}
                     

                        onDoubleClick={state.transferTypeId !== 1?handleSenderAccountIdDoubleClick: ""}
                     
                      type="text"
                      id="senderId"
                      name="senderId"
                      placeholder={t("sendTransfer.sender_account")}
                       onKeyDown={getKeyDownHandler(2)}
                      readOnly={!isFormEnabled || state.transferTypeId === 1}
                      required
                    /> */}
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
                      readOnly={!isFormEnabled || state.transferTypeId === 1}
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
                          {searchResults.map((account: AccountGet) => (
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
                      ref={registerRef(3)}
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
                      onKeyDown={getKeyDownHandler(3)}
                      // autoComplete="sender_address"
                      // readOnly={!!senderState.accountId}
                    />
                  </div>
                  {/* <div className="flex  flex-col gap-1 pb-2">
                    <label htmlFor="senderPhone">{t("customerS.phone")}</label>
                    <input
                      className="rounded-md border border-gray-300 px-2 py-[6px]"
                      value={senderState.phone}
                      onChange={handleCustomerInputChange}
                      type="text"
                      id="senderPhone"
                      autoComplete="senderPhone"
                      readOnly={!!senderState.accountId}
                    />
                  </div> */}
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
          {/* reciever */}
          <div
            ref={containerRef}
            className="relative mb-4 grid grid-cols-1 gap-2  px-3 "
          >
            <div className="flex flex-col gap-1">
              <h2>{t("sendTransfer.receiver_info")}</h2>
            </div>
            <div className="grid grid-cols-1 justify-between gap-4 border bg-lightBlue p-3 md:grid-cols-2 lg:grid-cols-2">
              <div className="flex flex-col gap-1">
                <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-4">
                  <div className="col-span-1 flex flex-col gap-1 pb-2">
                    <label htmlFor="recieverId">
                      {t("sendTransfer.reciever_account")}
                    </label>

                    <input
                      ref={registerRef(4)}
                      className="rounded-md border border-gray-300 px-3 py-[6px] placeholder:text-xs"
                      value={
                        receiverState.accountId === 0
                          ? ""
                          : receiverState.accountId.toString()
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? 0 : parseInt(value, 10);

                        setReceiverState((prev) => ({
                          ...prev,
                          accountId: isNaN(numValue) ? 0 : numValue,
                        }));

                        // Optional: Trigger search when user stops typing
                        if (numValue > 0) {
                          const timeoutId = setTimeout(() => {
                            searchRecieverAccountById(numValue);
                          }, 100);

                          return () => clearTimeout(timeoutId);
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        const numValue = parseInt(value, 10);

                        // Validate and fetch account when input loses focus
                        if (!isNaN(numValue) && numValue > 0) {
                          searchRecieverAccountById(numValue);
                        }
                      }}
                      onDoubleClick={handleReceiverAccountIdDoubleClick}
                      type="text"
                      id="recieverId"
                      name="recieverId"
                      placeholder={t("sendTransfer.reciever_account")}
                      required
                      onKeyDown={getKeyDownHandler(4)}
                      readOnly={!isFormEnabled}
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1 pb-2">
                    <label htmlFor="reciever_name">
                      {t("sendTransfer.reciever_name")}
                    </label>
                    <input
                      id="reciever_name"
                      type="text"
                      className="rounded-md border px-2 py-[6px] placeholder:text-xs"
                      value={searchReceiverTerm}
                      onChange={handleSearchRecieverChange}
                      placeholder={t("sendTransfer.search_receiver_name")}
                      readOnly={!isFormEnabled}
                      onFocus={() => {
                        if (!selectedReceiverAccount)
                          setShowReceiverResults(true);
                      }}
                    />
                    {!selectedReceiverAccount &&
                      searchReceiverTerm &&
                      showReceiverResults && (
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
                                handleSelectRecieverAccount(account);
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
                  <div className="flex  flex-col gap-1">
                    <label htmlFor="hmula_to_receiver">
                      {t("sendTransfer.hmula_to_receiver")}
                    </label>
                    <input
                      ref={registerRef(5)}
                      className="rounded-md border border-gray-300 px-2 py-[6px]"
                      onChange={(e) => {
                        const value = e.target.value;
                        setState({
                          ...state,
                          HmulatoComReciever:
                            value === "" ? 0 : parseInt(value) || 0,
                        });
                      }}
                      value={
                        state.HmulatoComReciever === 0
                          ? ""
                          : state.HmulatoComReciever
                      }
                      type="text"
                      id="hmula_to_receiver"
                      readOnly={!isFormEnabled}
                      onKeyDown={getKeyDownHandler(5)}
                      // autoComplete="hmula_to_receiver"
                      // readOnly={!!receiverState.accountId}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="hmula_from_receiver">
                      {t("sendTransfer.hmula_from_receiver")}
                    </label>
                    <input
                      ref={registerRef(6)}
                      className="rounded-md border border-gray-300 px-2 py-[6px]"
                      onChange={(e) => {
                        const value = e.target.value;
                        setState({
                          ...state,
                          HmulafromComReciever:
                            value === "" ? 0 : parseInt(value) || 0,
                        });
                      }}
                      value={
                        state.HmulafromComReciever === 0
                          ? ""
                          : state.HmulafromComReciever
                      }
                      type="text"
                      id="hmula_from_receiver"
                      name="hmula_from_receiver"
                      readOnly={!isFormEnabled}
                      onKeyDown={getKeyDownHandler(6)}
                      // autoComplete="hmula_from_receiver"
                      // readOnly={!!receiverState.accountId}
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
                    ref={registerRef(7)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.SenderPerson || ""}
                    onChange={inputHandle}
                    type="text"
                    id="SenderPerson"
                    name="SenderPerson"
                    readOnly={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(7)}
                    // autoComplete="sender_person"
                    // readOnly={!!senderState.accountId}
                  />
                </div>
                <div className="col-span-2 items-center gap-2 lg:flex">
                  <label htmlFor="SenderAddress">
                    {t("currencyS.address")}
                  </label>
                  <input
                    ref={registerRef(8)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.SenderAddress || ""}
                    onChange={inputHandle}
                    type="text"
                    id="SenderAddress"
                    name="SenderAddress"
                    readOnly={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(8)}
                    // autoComplete="SenderAddress"
                    // readOnly={!!senderState.accountId}
                  />
                </div>

                <div className="items-center gap-2  lg:flex">
                  <label htmlFor="SenderPhone">{t("customerS.phone")}</label>
                  <input
                    ref={registerRef(9)}
                    className="rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.SenderPhone || ""}
                    onChange={inputHandle}
                    type="text"
                    id="SenderPhone"
                    name="SenderPhone"
                    readOnly={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(9)}
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
                    ref={registerRef(10)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.RecieverPerson || ""}
                    onChange={inputHandle}
                    type="text"
                    id="RecieverPerson"
                    name="RecieverPerson"
                    readOnly={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(10)}
                    // autoComplete="receiver_person"
                    // readOnly={!!senderState.accountId}
                  />
                </div>
                <div className="col-span-2 items-center gap-2 lg:flex">
                  <label htmlFor="RecieverAddress">
                    {t("currencyS.address")}
                  </label>
                  <input
                    ref={registerRef(11)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.RecieverAddress || ""}
                    onChange={inputHandle}
                    type="text"
                    id="RecieverAddress"
                    name="RecieverAddress"
                    readOnly={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(11)}
                    // autoComplete="receiver_address"
                    // readOnly={!!senderState.accountId}
                  />
                </div>

                <div className="items-center gap-2  lg:flex">
                  <label htmlFor="RecieverPhone">{t("customerS.phone")}</label>
                  <input
                    ref={registerRef(12)}
                    className="rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.RecieverPhone || ""}
                    onChange={inputHandle}
                    type="text"
                    id="RecieverPhone"
                    name="RecieverPhone"
                    readOnly={!isFormEnabled}
                    onKeyDown={getKeyDownHandler(12)}
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
                {t("sendTransfer.total_amount_received")}
              </label>
              <input
                ref={registerRef(13)}
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
                onKeyDown={getKeyDownHandler(13)}
                disabled={!isFormEnabled}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="HmulafromComSender">
                {t("sendTransfer.hmula_from_sender")}
              </label>
              <input
                ref={registerRef(14)}
                className="input-field rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const value = e.target.value;
                  setState({
                    ...state,
                    HmulafromComSender:
                      value === "" ? 0 : parseFloat(value) || 0,
                  });
                }}
                value={
                  state.HmulafromComSender === 0 ? "" : state.HmulafromComSender
                }
                type="number"
                name="HmulafromComSender"
                id="HmulafromComSender"
                min={0}
                required
                onKeyDown={getKeyDownHandler(14)}
                disabled={!isFormEnabled}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="totalAmount">
                {t("sendTransfer.total_amount")}
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
                ref={registerRef(15)}
                className="input-field rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={inputHandle}
                value={state.Notes}
                name="Notes"
                id="Notes"
                disabled={!isFormEnabled}
                onKeyDown={getKeyDownHandler(15)}
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
          onClose={closeSenderModal}
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

        {/* Account Receiver Selection Modal */}
        <AccountSelectionModal
          isOpen={isReceiverAccountModalOpen}
          onClose={closeReceiverModal}
          title={t("home.select_account")}
          searchPlaceholder={t("currencyS.search_customer_name")}
          searchValue={modalSearchTerm}
          onSearchChange={handleModalSearch}
          accounts={accountsList}
          loading={modalLoading}
          onAccountSelect={handleModalAccountRecieverSelect}
          noAccountsMessage={t("home.no_accounts_found")}
          accountIdColumnText={t("categoryS.account_id")}
          accountNameColumnText={t("categoryS.account_name")}
          cancelButtonText={t("home.cancel")}
        />
        {/* {isReceiverAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-11/12 max-w-4xl rounded-lg bg-white px-6 py-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-md font-bold text-gray-800">
                  {t("home.select_account")}
                </h2>
                <button
                  onClick={() => setIsReceiverAccountModalOpen(false)}
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
                                handleModalAccountRecieverSelect(account)
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
                  onClick={() => setIsReceiverAccountModalOpen(false)}
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

export default SendTransfer;
