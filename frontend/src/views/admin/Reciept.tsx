import {
  clearSearchResults,
  getAccountByAccountId,
  searchAccounts,
} from "@/store/Reducers/accountReducer";
import { getAllCurrencies } from "@/store/Reducers/currencyReducer";
import { getMovementsByAccount } from "@/store/Reducers/movementReducer";
import { createReceipt, getReceipt, messageClear, updateReceipt } from "@/store/Reducers/receiptReducer";
import { RootState } from "@/store/rootReducers";
import { FORM_TYPES } from "@/types/formTypes";
import { PaymentState, UpdatePaymentData } from "@/types/receiptType";
import { Account } from "@/types/sendTransferTypes";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PropagateLoader } from "react-spinners";
import { getCurrentTime } from "../../utils/timeConvertor";
import { accountTypeId, overrideStyle } from "../../utils/utils";
// import { useReactToPrint } from "react-to-print";
import AccountSelectionModal from "@/components/AccountSelectionModal";
import useInputFocusManager from "@/hooks/useInputFocusManager";
import { useAppDispatch } from "@/store/hooks";
import { AccountGet } from "@/types/accountTypes";
import { sortAccountsByAccountId } from "@/utils/accountUtils";
import { useAccountBalances } from "@/utils/useAccountBalances";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BiEdit, BiPrinter, BiSave, BiSearch } from "react-icons/bi";
import { BsFileEarmarkText } from "react-icons/bs";
import { useConfirmation } from "../auth/useConfirmation";

const Reciept: React.FC = () => {
  const { t } = useTranslation();
 
 const dispatch = useAppDispatch();
const { fiscalYear: fiscalYearParam, voucherNo: voucherNoParam } = useParams<{
  fiscalYear?: string;
  voucherNo?: string;
}>();
  //  const { voucherNo: voucherNoFromUrl } = useParams<{ voucherNo: string }>();
    const navigate = useNavigate();
  
   const submitButtonRef = useRef<HTMLButtonElement>(null);
          const nextInputRef = useRef<HTMLInputElement>(null);
          
          
          const { 
          registerRef, 
          getKeyDownHandler, 
          getChangeHandler,
          focusNext 
        } = useInputFocusManager(4, {
          buttonRef: submitButtonRef,
          autoFocusOnChange: true,
          textareaNavigation: 'ctrl-enter', 
        });

  const { currencies } = useSelector((state: RootState) => state.currency);

  const { successMessage, errorMessage, loader , newVoucherNo, receiptId} = useSelector(
    (state: RootState) => state.receipt,
  );
  const {
    data: searchResults,
    loading,

  } = useSelector((state: RootState) => state.account.searchResults);
  // const { totals } = useSelector((state: RootState) => state.movement);

   const [isEditing, setIsEditing] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(
      null,
    );

    const [searchFiscalYear, setSearchFiscalYear] = useState<number>(new Date().getFullYear());
  
    const [voucherSearch, setVoucherSearch] = useState("");
    const [displayVoucherNo, setDisplayVoucherNo] = useState<string | number>("");
    const [currencyName, setCurrencyName] = useState("");
    const [isFormEnabled, setIsFormEnabled] = useState<boolean>(true);
   
    const { isOpen, message, showConfirmation, hideConfirmation, confirm } =
      useConfirmation();




  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<PaymentState>({
     currencyId: 0,
    currencyType: "",
    accountId: 0,
    payer: "",
    payerPhone: "",
    totalAmount: 0,
    note: "",
    createdAt: getCurrentTime(),
  });

  const [customerState, setCustomerState] = useState<Account>({
    accountId: 0,
    name: "",
    phone: "",
    address: "",
  });

    const currencyIdRef = useRef(state.currencyId);
    
    useEffect(() => {
      currencyIdRef.current = state.currencyId;
    }, [state.currencyId]);

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
    const voucherNo = parseInt(voucherNoParam);
    const fiscalYear = parseInt(fiscalYearParam);

    if (isNaN(voucherNo) || isNaN(fiscalYear)) {
      toast.error("Invalid voucher number or fiscal year in URL");
      navigate("/admin/dashboard/payment");
      return;
    }

    const loadVoucher = async () => {
      try {
        const result = await dispatch(
          getReceipt({ voucherNo, fiscalYear }) 
        ).unwrap();

        console.log(result.receipt);
        if (result.receipt) {
          const paymentData = result.receipt;

          setIsEditing(true);
          setIsFormEnabled(false);
          setEditingPaymentId(paymentData.id);
          setDisplayVoucherNo(voucherNo); // display voucher number only

          setState({
            currencyId: paymentData.currencyId,
            currencyType: paymentData.currencyType,
            accountId: paymentData.accountId,
            payer: "",
            payerPhone: "",
            totalAmount: paymentData.totalAmount,
            createdAt: new Date(paymentData.createdAt),
            note: paymentData.note || "",
          });

          setCustomerState({
            accountId: paymentData.accountId,
            name: paymentData.account?.name || "",
            phone: paymentData.account?.phone || "",
            address: paymentData.account?.address || "",
          });

          setSearchTerm(paymentData.account?.name || "");
          setSelectedAccount(paymentData.account || null);
          onAccountSelect(paymentData.accountId);
        } else {
          toast.error("Voucher not found");
          navigate("/admin/dashboard/payment");
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load voucher");
        navigate("/admin/dashboard/payment");
      }
    };

    loadVoucher();
  }
}, [voucherNoParam, fiscalYearParam, dispatch, navigate]);
    
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
        //   const result = await dispatch(getReceiptByVoucherNo(voucherNo)).unwrap();
     try {
       const result = await dispatch(
      getReceipt({ voucherNo, fiscalYear: searchFiscalYear })
    ).unwrap();
          if (result.receipt) {
            const paymentData = result.receipt;
    
            setIsEditing(true);
            setIsFormEnabled(false);
            setEditingPaymentId(paymentData.id);
            setDisplayVoucherNo(voucherNo);
    
            setState({
              currencyId: paymentData.currencyId,
              currencyType: paymentData.currencyType,
              accountId: paymentData.accountId,
              payer: "",
              payerPhone: "",
              totalAmount: paymentData.totalAmount,
                 createdAt: new Date(paymentData.createdAt),
              note: paymentData.note || "",
            });
            setCustomerState({
              accountId: paymentData.accountId,
              name: paymentData.account?.name || "",
              phone: paymentData.account?.phone || "",
              address: paymentData.account?.address || "",
            });
    
            setSearchTerm(paymentData.account?.name || "");
            setSelectedAccount(paymentData.account || null);
            onAccountSelect(paymentData.accountId);
         } else {
      toast.error(`No voucher #${voucherNo} found in year ${searchFiscalYear}`);
    }
  } catch (error: any) {
    toast.error(error.message || "Failed to load voucher");
  }
};

  

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    return () => {
      setSelectedAccount(null)
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
    const nextInput = document.querySelector('[data-next-select-currency]') as HTMLElement;
    if (nextInput) nextInput.focus();
  }, 10);
  };

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
    // calculateBalanceFromTotals,
    totals, 
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
      
      // setAccountBalance({
      //   taking,
      //   pay,
      //   balance,
      //   text,
      //   bg,
      // });
      
      // Also trigger hook update
      onAccountSelect(accountId);
      
    } catch (error: any) {
      console.error("Balance fetch error:", error);
      calculateAndSetBalance(0, 0);
    }
  };
  
    const calculateAndSetBalance = (taking: number, pay: number) => {
     
    const diff = Math.round(pay) - Math.round(taking);
    const balance = Math.abs(diff);
    const text = diff < 0 ? "قەرزدارە" : diff > 0 ? "هەیەتی" : "";
    const bg = diff === 0 ? "" : diff > 0 ? "rgb(11, 212, 8)" : "rgb(212, 29, 8)";
    
    
    // setAccountBalance({
    //   taking,
    //   pay,
    //   balance,
    //   text,
    //   bg,
    // });
  };

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

  const handleModalAccountSelect = (account: AccountGet) => {
     const currentCurrencyId = state.currencyId || currencyIdRef.current;
    
  if (!currentCurrencyId) {
    toast.error("Please select a currency first");
    return;
  }

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
      currencyId: currentCurrencyId // Ensure currency is set
    }
  };

  // Apply all updates
  setCustomerState(updates.customerState);
  setSearchTerm(updates.searchTerm);
  setSelectedAccount(updates.selectedAccount);
  setIsAccountModalOpen(updates.isAccountModalOpen);
  setState(updates.state);

    onAccountSelect(account.accountId);

      dispatch(
        getMovementsByAccount({
          currencyId: currentCurrencyId,
          accountId: account.accountId,
          page: 1,
          parPage: 1,
        })
      ).then(() => {
        console.log("Movements fetched for modal selection");
      });
    
      // Focus next input
      setTimeout(() => {
        if (focusNext) {
          focusNext(1);
        }
      }, 100);
      
      setModalSearchTerm('');
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
  setModalSearchTerm('');
};

const handleSave = async () => {
  if (state.currencyId && customerState.accountId) {
    console.log("Saving payment, current balance:", getCurrentBalance());
    
    // Call hook's onSave to trigger the save logic
    onSave(customerState.accountId);
    
    // Wait for the save operation to complete
    setTimeout(async () => {
      // Manually fetch the new balance
      await fetchDirectBalance(customerState.accountId, state.currencyId);
      
      // Dispatch to update Redux state
      dispatch(
        getMovementsByAccount({
          currencyId: state.currencyId,
          accountId: customerState.accountId,
          page: 1,
          parPage: 1,
        })
      ).then(() => {
        console.log("Balance updated after save");
      });
      
      // Focus next input
      if (focusNext) {
        focusNext(1);
      }
    }, 1000);
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
          getAccountByAccountId({ accountId: accountId }),
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
          setState(prev => ({
                  ...prev,
                  accountId: account.accountId,
                  currencyId: currentCurrencyId
                }));
          
                // Use timeout to ensure state is updated
                setTimeout(() => {
                  // Call onAccountSelect
                  onAccountSelect(account.accountId);
                  
                  // Also manually dispatch to get movements
                  dispatch(
                    getMovementsByAccount({
                      currencyId: currentCurrencyId,
                      accountId: account.accountId,
                      page: 1,
                      parPage: 1,
                    })
                  );
                }, 50);
        }
      } catch (error) {
        console.error("Failed to search account by ID:", error);
      }
    };
  
useEffect(() => {
    if (customerState.accountId > 0 && state.currencyId) {
      
      fetchDirectBalance(state.accountId);
    }
  }, [customerState.accountId, state.currencyId]);
  
  useEffect(() => {
    if (totals) {
    
      calculateAndSetBalance(totals.amountTaking, totals.amountPay);
    }
  }, [totals]);


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
    // dispatch(searchAccounts({ searchValue: "" }));

    const info = { parPage: 10, page: 1, searchValue: "" };
    dispatch(getAllCurrencies(info));
  }, [customerState.accountId, state.currencyId, dispatch]);

  

  const getVoucherNumber = (): number | null => {
  if (voucherNoParam) return parseInt(voucherNoParam);
  if (voucherSearch) return parseInt(voucherSearch);
  if (newVoucherNo) return parseInt(String(newVoucherNo));
  return null;
};

  // Form submission
  const add = (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
           state.totalAmount,
     
      state.currencyId,
      customerState.accountId,
      //   state.paymentStatus,
    ];

    if (requiredFields.some((field) => !field)) {
      toast.error(t("home.fill_fields"));
      return;
    }
 
    const createdAt = getCurrentTime();

    const receiptData = {
      receiptTypeId: FORM_TYPES.RECEIPT,
           currencyId: state.currencyId,
      currencyType: currencyName,
      accountId: customerState.accountId,
      payer: customerState.name,
      payerPhone: customerState.phone,
      totalAmount: state.totalAmount,
         note: state.note,
      createdAt,
      receiptNo: 0,
      debtorId: accountTypeId.QASA,
      daneId: customerState.accountId,
      typeId: FORM_TYPES.RECEIPT,
      type: "پارەوەرگرتن/قبض",
    };

     if (isEditing) {
      
        const voucherNo = getVoucherNumber();
    if (voucherNo === null) {
      alert('Please provide a voucher number');
      return;
    }
         
         const updateData: UpdatePaymentData = {
          voucherNo,
              receiptId: editingPaymentId || receiptId,
          
              // Fields you are allowed to update
              currencyId: state.currencyId,
              currencyType: state.currencyType || currencyName,
              accountId: customerState.accountId,
              payer: customerState.name,
              payerPhone: customerState.phone,
              totalAmount: state.totalAmount,
              note: state.note,
              debtorId: accountTypeId.QASA,
              daneId: customerState.accountId,
         };
         dispatch(updateReceipt(updateData)).then(() => {
          // setIsFormEnabled(false);
           // setIsEditing(false);
           // setIsEditMode(false);
         });
       } else {
         dispatch(createReceipt(receiptData)).then(() => {
          //  setIsFormEnabled(false);
           setVoucherSearch("");
         });
       }

  };

  const clearAll = () => {
      setState({
        currencyId: 0,
        currencyType: "",
        accountId: 0,
        payer: "",
        payerPhone: "",
        totalAmount: 0,
        note: "",
        createdAt: getCurrentTime(),
      });
      setCustomerState({
        accountId: 0,
        name: "",
        phone: "",
        address: "",
      });
     
      setIsFormEnabled(true);
      setIsEditing(false);
  
      setShowResults(false);
      dispatch(clearSearchResults());
      setSearchTerm("");
       setVoucherSearch("");
      setDisplayVoucherNo("");
      resetBalances();
  
      if (voucherNoParam || fiscalYearParam) { 
    navigate("/admin/dashboard/payment");
  }

    };
  
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
if (!isEditing) {
      
        setDisplayVoucherNo(newVoucherNo);
        
      }
        handleSave();
         setIsFormEnabled(false);
      dispatch(messageClear());
      //  clearAll();
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
                  {t("paymentS.receipt")}
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
                    to="/admin/dashboard/receipt-list"
                    className="rounded-md bg-primary px-5 py-[4px] text-white hover:bg-darkBlue hover:shadow-lg"
                  >
                    {t("paymentS.receipt_list")}
                  </Link>
                </div>
                 </div>
              </div>
            </div>

      <div className="w-full rounded-md bg-white p-4">
        <form
          onSubmit={add}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent default Enter submission
            }
          }}
        >
          <div className="grid grid-cols-2 items-center justify-between gap-2 border-b pb-3  md:grid-cols-2 lg:grid-cols-2">
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
                    </div>

         {/* Currency*/}
          <div className="mt-2 flex flex-col gap-2 py-2">
            <div className="grid grid-cols-1 gap-4 px-3 md:grid-cols-2 lg:grid-cols-5">
              <div className="flex w-full items-center gap-1">
                <label
                  htmlFor="currencyId"
                  className="w-2/7 px-[9px] text-sm font-medium lg:w-2/5 lg:px-[4px]"
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

         
          <div
            ref={containerRef}
            className="relative mb-3 grid grid-cols-1 gap-2  p-3 "
          >
            <div className="flex flex-col gap-1">
              <h2>{t("home.account_info")}</h2>
            </div>
            <div className="grid grid-cols-1 justify-between gap-4 border bg-gray-100 p-3 md:grid-cols-2 lg:grid-cols-2">
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

                        // Optional: Trigger search when user stops typing
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

                        // Validate and fetch account when input loses focus
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
                      // onChange={handleCustomerInputChange}
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
                      // onChange={handleCustomerInputChange}
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
    {/* Previous Balance - Always show */}
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
    
    {/* Current Balance - Show always but highlight when has value */}
    <div className="col-span-2 flex flex-col gap-1 py-2">
      <div className="whitespace-nowrap text-sm">
        {t("currencyS.balance_now")}
      </div>
      <div className="flex w-full flex-row gap-2">
        <input
          className={`input-field rounded-md border border-gray-300 px-2 py-[6px] ${balanceNow !== 0 ? 'bg-green-50' : 'bg-gray-50'}`}
          value={balanceNow || 0}
          type="number"
          disabled
          readOnly
        />
        <input
          className="w-2/5 rounded-md border border-gray-300 px-2 py-[6px] text-sm"
          style={{ 
            color: nowBg || "#000000",
            backgroundColor: balanceNow !== 0 ? "rgba(0, 255, 0, 0.1)" : "transparent",
            fontWeight: balanceNow !== 0 ? "bold" : "normal"
          }}
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

          <div className="mb-2 grid grid-cols-1 gap-4 px-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex w-full items-center  lg:gap-1">
              <label className="px-2" htmlFor="total_amount">
                {t("paymentS.receipt_amount")}
              </label>
              <input
               ref={registerRef(2)}
                className="input-field rounded-md border border-gray-300 px-2 py-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const value = e.target.value;
                  setState({
                    ...state,
                    totalAmount: value === "" ? 0 : parseInt(value) || 0,
                  });
                }}
                value={state.totalAmount === 0 ? "" : state.totalAmount}
                type="number"
                name="total_amount"
                id="total_amount"
                // onKeyDown={handleEnterToFocusNext}
                 disabled={!isFormEnabled}
                  onKeyDown={getKeyDownHandler(2)}
                required
              />
            </div>
          </div>
         {/* <div className="mb-2 grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex w-full items-center  gap-4">
              <label htmlFor="discount">{t("currencyS.discount")}</label>
              <input
                 className="input-field rounded-md border border-gray-300 px-2 py-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const value = e.target.value;
                  setState({
                    ...state,
                    discount: value === "" ? 0 : parseInt(value) || 0,
                  });
                }}
                value={state.discount === 0 ? "" : state.discount}
                type="number"
                name="discount"
                id="discount"
                 disabled={!isFormEnabled}
           
              />
            </div>
          </div> */}

         <div className="mb-2 grid grid-cols-1 gap-4 px-4 md:grid-cols-2">
            <div className="flex w-full items-center gap-6">
              <label htmlFor="note">{t("currencyS.note")}</label>
              <textarea
              ref={registerRef(3)}
                className="input-field w-full rounded-md border border-gray-300 p-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
    inputHandle(e); 
  
  }}
                value={state.note}
                name="note"
                id="note"
                 disabled={!isFormEnabled}
                  onKeyDown={getKeyDownHandler(3)}
              />
            </div>
          </div>

           {/* Submit Button */}
                   <div className="mb-4 mt-8 flex flex-col items-center gap-3 md:flex-row">
                     
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
    </div>
  );
};

export default Reciept;
