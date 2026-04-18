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
import { createQaid, messageClear } from "@/store/Reducers/qaidReducer";

import { RootState } from "@/store/rootReducers";
import { AccountGet } from "@/types/accountTypes";
import { FORM_TYPES } from "@/types/formTypes";
import { QaidState } from "@/types/qaidTypes";
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
import { overrideStyle } from "../../utils/utils";
import { useConfirmation } from "../auth/useConfirmation";

const Qaid: React.FC = () => {
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const { fiscalYear: fiscalYearParam, voucherNo: voucherNoParam } = useParams<{
    fiscalYear?: string;
    voucherNo?: string;
  }>();
 
  const navigate = useNavigate();
  const location = useLocation();

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

  const { successMessage, errorMessage, loader, qaidVoucherNo } = useSelector(
    (state: RootState) => state.qaid,
  );
  const { data: searchResults, loading } = useSelector(
    (state: RootState) => state.account.searchResults,
  );

  const [isRestoringCancelledTransfer, setIsRestoringCancelledTransfer] =
    useState(false);
  const [originalCancelledVoucherNo, setOriginalCancelledVoucherNo] = useState<
    number | null
  >(null);
  const [searchFiscalYear, setSearchFiscalYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [isNewTransfer, setIsNewTransfer] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormEnabled, setIsFormEnabled] = useState<boolean>(true);
  const [displayVoucherNo, setDisplayVoucherNo] = useState<string | number>("");
  

  const [voucherSearch, setVoucherSearch] = useState("");


  
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

  const [state, setState] = useState<QaidState>({
    id: 0,
    currencyId: 0,
    ComSender_ID: 0,
    ComeReciever_ID: 0,
    AmountTransfer: 0,
    Notes: "",
    createdAt: getCurrentTime(),
    USER_ID: user?.id || 0,
  });

  const currencyIdRef = useRef(state.currencyId);

  useEffect(() => {
    currencyIdRef.current = state.currencyId;
  }, [state.currencyId]);

  // Function 2: Populate form for viewing/editing existing active transfer
  // const populateFormForExistingTransfer = (qaidData: any) => {
  //   setIsRestoringCancelledTransfer(false);
  //   setIsNewTransfer(false);
  //   setIsEditing(false); // Start in view mode
  //   setIsFormEnabled(false); // Disabled for viewing, enable when edit button clicked
  //   // setEditingExchangeId(sendTransferData.id);
  //   setDisplayVoucherNo(qaidData.voucherNo);
 
  //   setState({
  //     id: qaidData.id,
  //     currencyId: Number(qaidData.currencyId) || 0,
  //     ComSender_ID: Number(qaidData.ComSender_ID) || 0,
  //     ComeReciever_ID: Number(qaidData.ComeReciever_ID) || 0,
  //     AmountTransfer: Number(qaidData.AmountTransfer) || 0,
  //     Notes: qaidData.Notes || "",
  //     createdAt: new Date(qaidData.createdAt),
  //     USER_ID: qaidData.USER_ID,
  //   });

  //   setSenderState({
  //     accountId: qaidData.ComSender_ID,
  //     name:
  //       qaidData.sender?.name || qaidData.SenderPerson || "",
  //     phone:
  //       qaidData.sender?.phone || qaidData.SenderPhone || "",
  //     address:
  //       qaidData.sender?.address ||
  //       qaidData.SenderAddress ||
  //       "",
  //   });
  //   setReceiverState({
  //     accountId: qaidData.ComeReciever_ID,
  //     name:
  //       qaidData.receiver?.name || qaidData.RecieverPerson || "",
  //     phone:
  //       qaidData.receiver?.phone || qaidData.RecieverPhone || "",
  //     address:
  //       qaidData.receiver?.address ||
  //       qaidData.RecieverAddress ||
  //       "",
  //   });

  //   setSearchSenderTerm(
  //     qaidData.sender?.name || qaidData.SenderPerson || "",
  //   );
  //      setSelectedSenderAccount(qaidData.sender || null);
  //   setSearchReceiverTerm(
  //     qaidData.receiver?.name || qaidData.RecieverPerson || "",
  //   );
  //   setSelectedReceiverAccount(qaidData.receiver || null);
  // };

  // // Function 4: Load existing transfer from API
  // const loadExistingTransfer = async (
  //   voucherNo: number,
  //   fiscalYear: number,
  // ) => {
  //   try {
  //     const result = await dispatch(
  //       getSendTransfer({ voucherNo, fiscalYear }),
  //     ).unwrap();

  //     if (result.sendTransfer) {
  //       populateFormForExistingTransfer(result.sendTransfer);
  //     } else {
  //       toast.error("Transfer not found");
  //       navigate("/admin/dashboard/send-transfer");
  //     }
  //   } catch (error: any) {
  //     console.error("❌ API fetch failed:", error);

  //     toast.error("Transfer not found in active records");
  //     navigate("/admin/dashboard/send-transfer");
  //   }
  // };

  // useEffect(() => {
  //   // localStorage.removeItem("restore_cancelled_transfer");

  //   // SCENARIO 1: We have a voucher number in URL (view/edit existing transfer)
  //   if (voucherNoParam && fiscalYearParam) {
  //     const voucherNo = parseInt(voucherNoParam);
  //     const fiscalYear = parseInt(fiscalYearParam);

  //     if (isNaN(voucherNo) || isNaN(fiscalYear)) {
  //       toast.error("Invalid voucher number in URL");
  //       navigate("/admin/dashboard/send-transfer");
  //       return;
  //     }

  //     loadExistingTransfer(voucherNo, fiscalYear);
  //   }
  // }, [voucherNoParam, fiscalYearParam, location.state, dispatch, navigate]);

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

    // try {
    //   const result = await dispatch(
    //     getSendTransfer({ voucherNo, fiscalYear: searchFiscalYear }),
    //   ).unwrap();
    //   if (result.qaid) {
    //     const qaidData = result.qaid;
    //     setIsEditing(false);
    //     setIsFormEnabled(false);
    //     // setEditingExchangeId(sendTransferData.id);
    //     setDisplayVoucherNo(voucherNo);
    //            setState({
    //       id: qaidData.id,
    //       currencyId: Number(qaidData.currencyId),
    //       ComSender_ID: Number(qaidData.ComSender_ID),
    //       ComeReciever_ID: Number(qaidData.ComeReciever_ID),
    //       AmountTransfer: Number(qaidData.AmountTransfer),
    //       Notes: qaidData.Notes,
    //       createdAt: new Date(qaidData.createdAt),
    //       USER_ID: qaidData.USER_ID,
    //     });
    //     setSearchFiscalYear(qaidData.fiscalYear),
    //       setSenderState({
    //         accountId: qaidData.ComSender_ID,
    //         name: qaidData.sender?.name || "",
    //         phone: qaidData.sender?.phone || "",
    //         address: qaidData.sender?.address || "",
    //       });
    //     setReceiverState({
    //       accountId: qaidData.ComeReciever_ID,
    //       name: qaidData.receiver?.name || "",
    //       phone: qaidData.receiver?.phone || "",
    //       address: qaidData.receiver?.address || "",
    //     });

    //     setSearchSenderTerm(qaidData.sender?.name || "");
    //      setSelectedSenderAccount(qaidData.sender || null);
    //          setSearchReceiverTerm(qaidData.receiver?.name || "");
    //     setSelectedReceiverAccount(qaidData.receiver || null);
    //     // onAccountSelect(exchangeData.accountId);
    //   }
    // } catch (error: any) {
    //   toast.error(error.message || "Failed to load voucher");
    // }
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
        focusNext(1);
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
        focusNext(3);
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
        focusNext(1);
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
        focusNext(3);
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
    "currencyId",
    "ComSender_ID",
    "HmulafromComSender",
    "ComeReciever_ID",
    "HmulafromComReciever",
    "HmulatoComReciever",
    "AmountTransfer",
    "HmulatoComSender",
    "TotalTransferToReceiver",
    "transferTypeId",
  ];

  const inputHandle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      [name]: numericFields.includes(name)
        ? value === ""
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
          focusNext(1);
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

  const getVoucherNumber = (): number | null => {
    if (voucherNoParam) return parseInt(voucherNoParam);
    if (voucherSearch) return parseInt(voucherSearch);
    if (qaidVoucherNo) return parseInt(String(qaidVoucherNo));
    return null;
  };

  // Form submission
  const add = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      senderState.accountId,
      receiverState.accountId,
      state.currencyId,

      state.AmountTransfer,
    ];

    if (requiredFields.some((field) => !field)) {
      toast.error(t("home.fill_fields"));
      return;
    }

    // const createdAt = getCurrentTime();

    const qaidData = {
      currencyId: state.currencyId,
      ComSender_ID: senderState.accountId,
      ComeReciever_ID: receiverState.accountId,
      AmountTransfer: state.AmountTransfer,
      Notes: state.Notes,
      createdAt: state.createdAt,
      USER_ID: user?.id || 0,

      typeId: FORM_TYPES.QAID,
      type: "القید/ گواستنەوەی پارە",
      debtorId: senderState.accountId,
      creditorId: receiverState.accountId,
    };
    if (isEditing) {
      const voucherNo = getVoucherNumber();
      if (voucherNo === null) {
        alert("Please provide a voucher number");
        return;
      }

      //      const updateData: UpdateQaidData = {
      //       voucherNo,
      //        currencyId: state.currencyId,
      //   ComSender_ID: senderState.accountId,

      //   ComeReciever_ID: receiverState.accountId,

      //   AmountTransfer: state.AmountTransfer,

      //   Notes: state.Notes,
      //   createdAt: state.createdAt,
      //   USER_ID: 1,
      //   debtorId: senderState.accountId,
      //     creditorId: receiverState.accountId,

      //      };
      //      dispatch(c(updateData)).then(() => {
      //       setIsFormEnabled(false);
      //        // setIsEditing(false);
      //        // setIsEditMode(false);
      //      });
    } else {
      dispatch(createQaid(qaidData)).then(() => {
        // setIsFormEnabled(false);
        setVoucherSearch("");
      });
    }
  };

  const clearAll = () => {
    setState({
      currencyId: 0,
      ComSender_ID: 0,
      ComeReciever_ID: 0,
      AmountTransfer: 0,
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
    setIsFormEnabled(true);
    setIsEditing(false);
    setOriginalCancelledVoucherNo(0);
    setIsRestoringCancelledTransfer(false);
    setIsNewTransfer(true);


    setVoucherSearch("");
    setDisplayVoucherNo("");
     resetBalances();
    if (voucherNoParam || fiscalYearParam) {
      navigate("/admin/dashboard/qaid");
    }
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      if (!isEditing) {
        setDisplayVoucherNo(qaidVoucherNo);
      }
       setIsFormEnabled(false);
      handleSaveSender();
      handleSaveReciever();
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
            {t("dashboard.Qaid")}
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
              onChange={(e) =>
                setSearchFiscalYear(
                  parseInt(e.target.value) || new Date().getFullYear(),
                )
              }
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
                to="/admin/dashboard/qaid-list"
                className="rounded-md bg-primary px-5 py-[4px] text-white hover:bg-darkBlue hover:shadow-lg"
              >
                {t("dashboard.Qaid List")}
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
                                              
                                   setTimeout(() => {
                          const nextInput = document.querySelector(
                            "[data-next-input]",
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

                        if (!isNaN(numValue) && numValue > 0) {
                          searchSenderAccountById(numValue);
                        }
                      }}
                      // Conditional onDoubleClick handler
                      onDoubleClick={handleSenderAccountIdDoubleClick}
                      type="text"
                      id="senderId"
                      name="senderId"
                      placeholder={t("sendTransfer.sender_account")}
                      onKeyDown={getKeyDownHandler(1)}
                      readOnly={!isFormEnabled}
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
              </div>
            </div>
          </div>
          <div className="mb-6 mt-6 grid grid-cols-1 gap-4 px-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="flex w-full items-center  lg:gap-1">
              <label className="px-2" htmlFor="totalAmount">
                {t("paymentS.receipt_amount")}
              </label>
              <input
                ref={registerRef(2)}
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
                onKeyDown={getKeyDownHandler(2)}
                disabled={!isFormEnabled}
              />
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
                      ref={registerRef(3)}
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
                      onKeyDown={getKeyDownHandler(3)}
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
              </div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 px-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="Notes">{t("currencyS.note")}</label>
              <textarea
                ref={registerRef(4)}
                className="input-field rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={inputHandle}
                value={state.Notes}
                name="Notes"
                id="Notes"
                disabled={!isFormEnabled}
                onKeyDown={getKeyDownHandler(4)}
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
       
      </div>
      {renderConfirmationModal()}
    </div>
  );
};

export default Qaid;
