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
  createPaidTransfer,
  getIncomeTransfer,
  messageClear
} from "@/store/Reducers/incomeTransferReducer";
import {
  IncomeTransfer,
  IncomeTransferState,
  ReceiverAddress,
} from "@/types/incomeTransferType";
import { sortAccountsByAccountId } from "@/utils/accountUtils";
import React, { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { BiPrinter, BiSave } from "react-icons/bi";
import { BsFileEarmarkText } from "react-icons/bs";
import { FaUndo } from "react-icons/fa";
import { useSelector } from "react-redux";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { PropagateLoader } from "react-spinners";
import { getCurrentTime } from "../../utils/timeConvertor";
import { accountTypeId, overrideStyle } from "../../utils/utils";
import { useConfirmation } from "../auth/useConfirmation";

const PaidIncomeTransfer: React.FC = () => {
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
 
  const [searchParams] = useSearchParams();
  const payType = searchParams.get("payType");
  const accountType = searchParams.get("account");
    

  const payTypeNumber = payType ? parseInt(payType) : null;
  const { user } = useAuth();
  const {
    successMessage,
    errorMessage,
    loader,
    paidIncomeVoucherNo,
incomeTransfer,
  } = useSelector((state: RootState) => state.incomeTransfer);
  const { data: searchResults, loading } = useSelector(
    (state: RootState) => state.account.searchResults,
  );

   const submitButtonRef = useRef<HTMLButtonElement>(null);
          const nextInputRef = useRef<HTMLInputElement>(null);
  const { 
          registerRef, 
          getKeyDownHandler, 
          getChangeHandler,
          focusNext 
        } = useInputFocusManager(5, {
          buttonRef: submitButtonRef,
          autoFocusOnChange: true,
          textareaNavigation: 'ctrl-enter', 
        });



  const [isEditing, setIsEditing] = useState(false);
  const [isFormEnabled, setIsFormEnabled] = useState<boolean>(true);
  const [displayVoucherNo, setDisplayVoucherNo] = useState<string | number>("");
  const [paymentType, setPaymentType] = useState<boolean>(false);
   const senderIdInputRef = useRef<HTMLInputElement>(null);
  const [isInputHighlighted, setIsInputHighlighted] = useState(false);
 const [searchFiscalYear, setSearchFiscalYear] = useState<number>(new Date().getFullYear());


  const [currencyName, setCurrencyName] = useState("");

  const { isOpen, message, showConfirmation, hideConfirmation, confirm } =
    useConfirmation();

  // Search Name
  const [searchSenderTerm, setSearchSenderTerm] = useState("");
  const [selectedSenderAccount, setSelectedSenderAccount] = useState<any>(null);
  const [showSenderResults, setShowSenderResults] = useState(false);
  const [paidDate, setPaidDate] = useState(getCurrentTime());

  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [senderState, setSenderState] = useState<AccountGet>({
    accountId: 0,
    name: "",
    phone: "",
    address: "",
  });

  const [receiverIncomeState, setReceiverIncomeState] =
    useState<ReceiverAddress>({
      id: 0,
      companyName: "",
      personName: "",
      address: "",
      phone: "",
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

  // Function 1: Populate form for  existing active transfer
  const populateFormForExistingTransfer = (
    incomeTransferData: IncomeTransfer,
  ) => {
    setIsEditing(false);
    setIsFormEnabled(false);

   

    setDisplayVoucherNo(incomeTransferData.voucherNo);
   
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
setSearchFiscalYear(incomeTransferData.fiscalYear),
    setCurrencyName(incomeTransferData.currency?.currency || "");
  };

  useEffect(() => {
    const loadAndPopulate = async () => {
        if (voucherNoParam && fiscalYearParam) {
    const voucherNo = parseInt(voucherNoParam);
    const fiscalYear = parseInt(fiscalYearParam);
     if (isNaN(voucherNo) || isNaN(fiscalYear)) {
        toast.error("Invalid voucher number");
        navigate("/admin/dashboard/income-transfers");
        return;
      }
    

      try {
        const result = await dispatch(
         getIncomeTransfer({voucherNo, fiscalYear}),
        ).unwrap();

        // Since result is ApiResponse, we need to check for incomeTransfer
        if (result && result.incomeTransfer) {
          populateFormForExistingTransfer(result.incomeTransfer);
        } else {
          toast.error("Transfer not found");
          navigate("/admin/dashboard/income-transfers");
        }
      } catch (error: any) {
        console.error("Error loading transfer:", error);
        toast.error(error?.message || "Failed to load transfer");
        navigate("/admin/dashboard/income-transfers");
      }
    }
    }

    loadAndPopulate();
  }, [voucherNoParam, fiscalYearParam, dispatch, navigate]);


  

  useEffect(() => {
    if (payTypeNumber === 1) {
      setSenderState({
        accountId: 100,
        name: "صندوق",
        phone: "",
        address: "",
      });

  setPaymentType(false);

      // Focus with highlight
      
    } else if (payTypeNumber === 2) {
  const parsed = parseInt(accountType ?? "0", 10);
  const accountId = isNaN(parsed) ? 0 : parsed;
  setSenderState({
    accountId,
    name: "",
    phone: "",
    address: "",
  });
    
  setPaymentType(true);



    }
    else {
       const parsed = parseInt(accountType ?? "0", 10);
  const accountId = isNaN(parsed) ? 0 : parsed;
  setSenderState({
    accountId,
    name: "",
    phone: "",
    address: "",
  });   
  setPaymentType(true);

    }
    const timer = setTimeout(() => {
        if (senderIdInputRef.current) {
          setIsInputHighlighted(true);
          senderIdInputRef.current.focus();
          senderIdInputRef.current.select();

          // Remove highlight after 1.5 seconds
          setTimeout(() => {
            setIsInputHighlighted(false);
          }, 1500);
        }
      }, 50);
       return () => clearTimeout(timer);
  }, [payTypeNumber, accountType]);

  

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

  const handleDateChange = (date: Date | null): void => {
    if (!date) return;

    setPaidDate(date);
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
    setSenderState({
      accountId: account.accountId,
      name: account.name,
      phone: account.phone || "",
      address: account.address || "",
    });
    setSearchSenderTerm(account.name);
    setSelectedSenderAccount(account);
    setIsSenderAccountModalOpen(false);

    // onAccountSelect(account.accountId);
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

   setTimeout(() => {
    if (focusNext) {
      focusNext(1);
    }
  }, 100);
  setModalSearchTerm('');
};

  const inputHandle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setReceiverIncomeState((prev) => ({ ...prev, [name]: value }));
  };



  // const {
  //   onAccountSelect,
  //   onSave,
  //   resetBalances,
  //   // balancePrev,
  //   // prevText,
  //   // prevBg,
  //   // balanceNow,
  //   // nowText,
  //   // nowBg,
  // } = useAccountBalances(state.currencyId);

  // const handleSaveSender = () => {
  //   if (state.currencyId && senderState.accountId) {
  //     onSave(senderState.accountId);
  //   }
  // };

  const searchSenderAccountById = async (accountId: number) => {
    try {
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
        // onAccountSelect(account.accountId);
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

  // const enableEditMode = () => {
  //   showConfirmation(t("home.are_you_sure_to_update"), () => {
  //     setIsFormEnabled(true);
  //     setIsEditing(true);
   
  //   });
  // };

  const handleClearWithConfirmation = () => {
    showConfirmation(t("home.are_you_sure_to_return"), () => {
      clearAll();
    });
  };

  // Form submission
  const add = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      senderState.accountId,

      state.currencyId,

      state.TotalTransferToReceiver,
     
    ];

    if (requiredFields.some((field) => !field)) {
      toast.error(t("home.fill_fields"));
      return;
    }
 

    const paidIncomeTransferData = {
      incomeVoucherNo:incomeTransfer?.voucherNo,
      currencyId: state.currencyId,
      ComSender_ID: state.ComSender_ID,
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
      Notes: t("sendTransfer.pay_to"),
      createdAt: state.createdAt,
      USER_ID: user?.id ||0,
      paidDate: paidDate,
      paidTransferAddressId: 0,

      companyName: payTypeNumber===1 ? receiverIncomeState.companyName :senderState.name,
      personName: payTypeNumber===1 ?receiverIncomeState.personName:senderState.name,
      address: payTypeNumber===1 ?receiverIncomeState.address:senderState.address,
      phone: payTypeNumber===1 ?receiverIncomeState.phone:senderState.phone,
      accountId: senderState.accountId,

      currencyType: currencyName,
      typeId: FORM_TYPES.PAIDINCOMETRANSFER,
       type:  payTypeNumber===1 ? t("sendTransfer.paid_income_transfer") :t("sendTransfer.paid_to_account"),

      HawalaIncom_ID: accountTypeId.HawalaIncom_ID,
    };
try {

    await dispatch(createPaidTransfer(paidIncomeTransferData)).unwrap();
    // setIsFormEnabled(false);
    setIsEditing(false);

  } catch (error: any) {
  
  // If the error has fieldErrors directly (your case)
  if (error?.fieldErrors) {
    const fieldErrors = error.fieldErrors;
 
    const firstField = Object.keys(fieldErrors)[0];
    if (firstField) {
      toast.error(`${firstField}: ${fieldErrors[firstField][0]}`);

    }
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

    setReceiverIncomeState({
      id: 0,
      companyName: "",
      personName: "",
      address: "",
      phone: "",
    });
    setShowSenderResults(false);
    dispatch(clearSearchResults());
    setSearchSenderTerm("");
    setIsFormEnabled(true);
    setIsEditing(false);
setPaidDate(getCurrentTime);

    setDisplayVoucherNo("");
    setCurrencyName("");
    // resetBalances();
   if (voucherNoParam || fiscalYearParam) { 
      navigate("/admin/dashboard/income-transfer-list");
    }
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      if (!isEditing) {
        // handleSaveSender();

        setDisplayVoucherNo(paidIncomeVoucherNo);

      }
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
          <h2 className="text-base font-medium text-[#5c5a5a]">
            {t("dashboard.Tasdid Transfers")}
          </h2>
        </div>

        <div className="flex w-full flex-col items-center gap-2 px-3 pb-3 lg:flex-row lg:justify-end lg:gap-1">
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleClearWithConfirmation}
                className="flex items-center gap-2 rounded-md bg-red-500 px-4 py-[4px] text-white hover:bg-gray-600"
              >
                <BsFileEarmarkText size={18} /> {t("home.new")}
              </button>
            )}
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

      <div className="w-full rounded-md bg-white px-3 pb-2">
        <form onSubmit={add}>
          <div className="grid grid-cols-2 items-center justify-between gap-2 border-b pb-2 pt-3 md:grid-cols-2 lg:grid-cols-2">
            <div className="items-center justify-start gap-2 lg:flex">
              <label htmlFor="date">{t("importCarS.import_date")}</label>

              <DatePicker
                selected={paidDate}
                onChange={handleDateChange}
                id="date"
                dateFormat="yyyy-MM-dd"
                className="input-field justify-center rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                // disabled={!isFormEnabled}
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

              {/* <label htmlFor="transfer_Id">
                {t("sendTransfer.transfer_Id")}
              </label>
              <input
                className="input-field rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={displayTransferId}
                type="text"
                name="transfer_Id"
                id="transfer_Id"
                disabled
              /> */}
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
            <div className="mb-6 mt-4 grid grid-cols-1 justify-start gap-2 border ">
              <div className="grid grid-cols-2 justify-between gap-4 bg-gray-100 px-4 py-2 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-2 items-center gap-2 lg:flex">
                  <label className="w-36" htmlFor="SenderPerson">
                    {t("sendTransfer.sender_person")}
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.SenderPerson || ""}
                    // onChange={inputHandle}
                    type="text"
                    id="SenderPerson"
                    name="SenderPerson"
                    readOnly={true}
                    // autoComplete="sender_person"
                    // readOnly={!!senderState.accountId}
                  />
                </div>
                <div className="col-span-2 items-center gap-2 lg:flex">
                  <label htmlFor="SenderAddress">
                    {t("currencyS.address")}
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.SenderAddress || ""}
                    // onChange={inputHandle}
                    type="text"
                    id="SenderAddress"
                    name="SenderAddress"
                    readOnly={true}
                    // autoComplete="SenderAddress"
                    // readOnly={!!senderState.accountId}
                  />
                </div>

                <div className="items-center gap-2  lg:flex">
                  <label htmlFor="SenderPhone">{t("customerS.phone")}</label>
                  <input
                    className="rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.SenderPhone || ""}
                    // onChange={inputHandle}
                    type="text"
                    id="SenderPhone"
                    name="SenderPhone"
                    readOnly={true}
                    // autoComplete="sender_phone"
                    // readOnly={!!senderState.accountId}
                  />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 justify-between gap-4 bg-gray-100 px-4 py-2 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-2 items-center gap-2 lg:flex">
                  <label className="w-36" htmlFor="RecieverPerson">
                    {t("sendTransfer.receiver_person")}
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.RecieverPerson || ""}
                    // onChange={inputHandle}
                    type="text"
                    id="RecieverPerson"
                    name="RecieverPerson"
                    readOnly={true}
                    // autoComplete="receiver_person"
                    // readOnly={!!senderState.accountId}
                  />
                </div>
                <div className="col-span-2 items-center gap-2 lg:flex">
                  <label htmlFor="RecieverAddress">
                    {t("currencyS.address")}
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.RecieverAddress || ""}
                    // onChange={inputHandle}
                    type="text"
                    id="RecieverAddress"
                    name="RecieverAddress"
                    readOnly={true}
                    // autoComplete="receiver_address"
                    // readOnly={!!senderState.accountId}
                  />
                </div>

                <div className="items-center gap-2  lg:flex">
                  <label htmlFor="RecieverPhone">{t("customerS.phone")}</label>
                  <input
                    className="rounded-md border border-gray-300 px-2 py-[6px]"
                    value={state.RecieverPhone || ""}
                    // onChange={inputHandle}
                    type="text"
                    id="RecieverPhone"
                    name="RecieverPhone"
                    readOnly={true}
                    // autoComplete="receiver_phone"
                    // readOnly={!!senderState.accountId}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="items-center justify-start gap-3 px-1 lg:flex">
            <label className="px-2" htmlFor="date">
              {t("sendTransfer.income_date")}
            </label>

            <DatePicker
              selected={state.createdAt}
              // onChange={handleDateChange}
              id="createDate"
              dateFormat="yyyy-MM-dd"
              className="input-field justify-center rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isFormEnabled}
            />
          </div>
          {/* Sender */}
          <div
            ref={containerRef}
            className="relative mt-3 grid grid-cols-1 gap-2  p-3 "
          >
            <div className="xlg:grid-cols-4 grid grid-cols-1 justify-between gap-4  bg-lightBlue px-4 py-2 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex w-full items-center gap-2">
                <label className="w-36" htmlFor="sender_name">
                  {t("sendTransfer.sender_name")}
                </label>
                <input
                  id="sender_name"
                  type="text"
                  className="w-full rounded-md border px-2 py-[6px] placeholder:text-xs"
                  value={incomeTransfer?.sender?.name || ""}
                  readOnly={true}
                />
              </div>
              <div className="flex w-full items-center gap-2">
                <label className="w-36" htmlFor="senderId">
                  {t("sendTransfer.sender_code")}
                </label>

                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-[6px] placeholder:text-xs"
                  value={
                    state.ComSender_ID === 0
                      ? ""
                      : state.ComSender_ID.toString()
                  }
                  type="text"
                  id="senderId"
                  name="senderId"
                  placeholder={t("sendTransfer.sender_account")}
                  readOnly={true}
                  required
                />
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-3 mt-2 grid grid-cols-2  gap-3 px-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="flex  items-center gap-2  sm:gap-0">
              <label className="w-36" htmlFor="totalAmount">
                {t("sendTransfer.amount")}
              </label>
              <input
                className="input-field w-full rounded-md border border-gray-300 px-2 py-[5px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="number"
                name="totalAmount"
                id="totalAmount"
                value={state.TotalTransferToReceiver || ""}
                disabled
                readOnly
              />
            </div>
            <div className="flex items-center gap-3">
              {incomeTransfer?.currency?.currency}
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative grid grid-cols-1 gap-2  px-3 py-2"
          >
            <div className="flex flex-col gap-1">
              {!paymentType || accountType === "100" ? (
                <p className="mt-1 text-sm text-green-600">
                  ✅ {t("sendTransfer.snduq_account")}
                </p>
              ) : (
                <h2>{t("sendTransfer.pay_to_account")}</h2>
              )}
            </div>
            <div className="grid grid-cols-1 justify-between gap-4 border bg-lightGreen p-3 md:grid-cols-2 lg:grid-cols-2">
              <div className="flex flex-col gap-1 pb-1">
                <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-4">
                  <div className="col-span-1 flex flex-col gap-1 pb-2">
                    <label htmlFor="sender_com_Id">
                      {t("categoryS.account_id")}
                    </label>
                   
                    <input
                    data-next-input
                     ref={registerRef(0)}
                      // ref={senderIdInputRef}
                      className={`w-full rounded-md border px-3 py-[6px] transition-all duration-300 placeholder:text-xs ${
                        isInputHighlighted
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-300"
                      } ${!paymentType ? "cursor-default bg-gray-100" : ""}`}
                      value={
                        senderState.accountId === 0
                          ? ""
                          : senderState.accountId.toString()
                      } // Already controlled
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
                      onDoubleClick={
                        paymentType
                          ? handleSenderAccountIdDoubleClick
                          : undefined
                      } // Only allow double-click when editable
                      type="text"
                      id="sender_com_Id"
                      name="senderId"
                      placeholder={
                        paymentType
                          ? t("sendTransfer.sender_account")
                          : t("sendTransfer.snduq_account")
                      }
                      onKeyDown={getKeyDownHandler(0)} 
                      readOnly={paymentType}
                      //   disabled={!paymentType} // Add disabled attribute when not paymentType
                      required={paymentType} // Only required when editable
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1 pb-2">
                    <label htmlFor="sender_com_name">
                      {t("sendTransfer.sender_name")}
                    </label>
                    <input
                      id="sender_com_name"
                      type="text"
                      className="rounded-md border px-2 py-[6px] placeholder:text-xs"
                      value={searchSenderTerm}
                      onChange={handleSearchSenderChange}
                      placeholder={t("sendTransfer.search_sender_name")}
                      readOnly={!paymentType}
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
              </div>
            </div>
          </div>

          {/* Sender & Receiver Person */}
          <div
            ref={containerRef}
            className="relative grid grid-cols-1 gap-2  px-3"
          >
            <div className="mb-3 mt-3 grid grid-cols-1 justify-start gap-2 border ">
              <div className="grid grid-cols-1 justify-between gap-4 bg-lightBlue px-4 py-2 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex w-full items-center gap-2">
                  <label className="w-40" htmlFor="personName">
                    {t("sendTransfer.receiver_person")}
                  </label>
                  <input
                    ref={registerRef(1)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={receiverIncomeState.personName || ""}
                    onChange={inputHandle}
                    type="text"
                    id="personName"
                    name="personName"
                     onKeyDown={getKeyDownHandler(1)} 
                    required={payTypeNumber===1}
                  />
                </div>
                <div className="flex w-full items-center gap-2">
                  <label htmlFor="phone">{t("customerS.phone")}</label>
                  <input
                    ref={registerRef(2)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={receiverIncomeState.phone || ""}
                    onChange={inputHandle}
                    type="text"
                    id="phone"
                    name="phone"
                     onKeyDown={getKeyDownHandler(2)} 
                    required={payTypeNumber===1}
                  />
                </div>
                <div className="flex w-full items-center gap-2">
                  <label htmlFor="address">{t("currencyS.address")}</label>
                  <input
                    ref={registerRef(3)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={receiverIncomeState.address || ""}
                    onChange={inputHandle}
                    type="text"
                    id="address"
                    name="address"
                    onKeyDown={getKeyDownHandler(3)} 
                    // required={payTypeNumber===1}
                  />
                </div>

                <div className="flex w-full items-center gap-2">
                  <label htmlFor="companyName">
                    {t("sendTransfer.company_name")}
                  </label>
                  <input
                    ref={registerRef(4)}
                    className="w-full rounded-md border border-gray-300 px-2 py-[6px]"
                    value={receiverIncomeState.companyName || ""}
                    onChange={inputHandle}
                    type="text"
                    id="companyName"
                    name="companyName"
                    onKeyDown={getKeyDownHandler(4)} 
                    // required={payTypeNumber===1}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mb-4 mt-8 flex flex-col items-center gap-2 px-3 md:flex-row">
            <button
             ref={submitButtonRef}
              disabled={loader}
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
              <FaUndo size={18} /> {t("home.return")}
            </button>

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

export default PaidIncomeTransfer;
