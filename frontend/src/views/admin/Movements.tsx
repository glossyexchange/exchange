import AccountSelectionModal from "@/components/AccountSelectionModal";
import { useAppDispatch } from "@/store/hooks";
import {
  clearSearchResults,
  getAccountByAccountId,
  searchAccounts,
} from "@/store/Reducers/accountReducer";
import { getAllCurrencies } from "@/store/Reducers/currencyReducer";
import {
  getMovementsByAccount,
  resetMovements,
} from "@/store/Reducers/movementReducer";
import { RootState } from "@/store/rootReducers";
import { AccountGet } from "@/types/accountTypes";
import { CurrencyMovementState } from "@/types/currencyTypes";
import { MovementState } from "@/types/movementType";
import { sortAccountsByAccountId } from "@/utils/accountUtils";
import { formatLocalDate } from "@/utils/timeConvertor";
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
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Pagination from "../Pagination";

const Movements: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === "ar" || currentLanguage === "kr";
  const location = useLocation();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchValue, setSearchValue] = useState<string>("");
  const [parPage, setParPage] = useState<number>(10);

  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [balanceNow, setBalanceNow] = useState<number>(0);
  const [prevBalance, setPrevBalance] = useState<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountsList, setAccountsList] = useState<AccountGet[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");

  const { currencies } = useSelector((state: RootState) => state.currency);

  const { movements, totals, pagination } = useSelector(
    (state: RootState) => state.movement,
  );


  const { data: searchResults = [] } = useSelector(
    (state: RootState) => state.account.searchResults,
  );
  const [fromDate, setFromDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    return date;
  });

  const [toDate, setToDate] = useState<Date | null>(() => {
    const date = new Date();
    // For Iraq time: 23:59:59.999 in Iraq = 20:59:59.999 in UTC
    date.setUTCHours(20, 59, 59, 999); // Adjusted for GMT+3
    return date;
  });

  const handleFromDateChange = (date: Date | null) => {
    if (!date) return setFromDate(null);

    // Get the UTC date components
    const utcDate = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    setFromDate(utcDate);
  };

  const handleToDateChange = (date: Date | null) => {
    if (!date) return setToDate(null);

    // For Iraq (GMT+3): End of day in Iraq (23:59:59.999) = 20:59:59.999 in UTC
    const utcDate = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        20,
        59,
        59,
        999, // Adjusted for GMT+3
      ),
    );
    setToDate(utcDate);
  };

  const [currencyState, setCurrencyState] = useState<CurrencyMovementState>({
    currencyId: 0,
    currency: "",
  });

  const [customerState, setCustomerState] = useState<AccountGet>({
    accountId: 0,
    name: "",
    phone: "",
    address: "",
  });

  // const [balanceNow, setBalanceNow] = useState(0);
  const [debDanText, setDebDanText] = useState("");
  const [debDanBg, setDebDanBg] = useState("");

  const resetAll = useCallback(() => {
    setCurrentPage(1);
    setSearchValue("");
    setParPage(30);
    setSearchTerm("");
    setSelectedAccount(null);
    setShowResults(false);

    setCurrencyState({ currencyId: 0, currency: "" });
    setCustomerState({ accountId: 0, name: "", phone: "", address: "" });
    setDebDanText("");
    setDebDanBg("");

    // Clear the movements from Redux state
    dispatch(resetMovements());
  }, [dispatch]);

  useEffect(() => {
    resetAll();
    setIsInitialLoad(true);
  }, [location.pathname]);

  const filterParams = useMemo(
    () => ({
      parPage,
      page: currentPage,
      searchValue,
      fiscalYear: fromDate ? fromDate.getUTCFullYear() : undefined, // ← add this line
      currencyId: currencyState.currencyId || 0,
      accountId: customerState.accountId || 0,
      fromDate: fromDate ?? undefined,
      toDate: toDate ?? undefined,
    }),
    [
      parPage,
      currentPage,
      searchValue,
      fromDate, // now a dependency
      currencyState.currencyId,
      customerState.accountId,
      toDate,
    ],
  );

  useEffect(() => {
    if (
      isInitialLoad ||
      customerState.accountId <= 0 ||
      currencyState.currencyId <= 0
    ) {
      setIsInitialLoad(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        await dispatch(getMovementsByAccount(filterParams)).unwrap();
      } catch (error) {
        console.error("Error fetching movements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    filterParams,
    isInitialLoad,
    customerState.accountId,
    currencyState.currencyId,
  ]);

  const handleExchangeCurrencyChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedId = e.target.value;

    if (selectedId === "0") {
      setCurrencyState((prev) => ({
        ...prev,
        currencyId: 0,
        currency: "",
      }));
    } else {
      const numValue = parseInt(selectedId);
      const selectedCurrency = currencies?.find(
        (c) => c.currencyId === numValue,
      );

      setCurrencyState((prev) => ({
        ...prev,
        currencyId: numValue,
        currency: selectedCurrency?.currency || "",
      }));
    }
    // Trigger filter selection
    // setHasFilterSelected(true);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      dispatch(clearSearchResults());
    };
  }, [dispatch]);

  const searchAccountById = async (accountId: number) => {
    try {
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
      }
    } catch (error) {
      console.error("Failed to search account by ID:", error);
    }
  };

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

  const closeModal = () => {
    setIsAccountModalOpen(false);
    setModalSearchTerm("");
  };

  const handleModalAccountSelect = (account: AccountGet) => {
    setCustomerState({
      accountId: account.accountId,
      name: account.name,
      phone: account.phone || "",
      address: account.address || "",
    });
    setSearchTerm(account.name);
    setSelectedAccount(account);
    setIsAccountModalOpen(false);
  };

  const handleModalSearch = (value: string) => {
    setModalSearchTerm(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      fetchAccountsForModal(value.trim());
    }, 300);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAccount(null);
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
  };

  const balanceInfo = useMemo(() => {
    if (!totals) return { remain: 0, text: "", bg: "" };

    const rem = (totals?.amountPay || 0) - (totals?.amountTaking || 0);

    let bg = "";
    if (rem < 0) bg = "rgb(255, 0, 0)"; // red for debtor (قەرزدارە)
    else if (rem > 0) bg = "rgb(0, 125, 0)"; // green for creditor (هەیەتی)

    return {
      remain: Math.abs(rem),
      text: rem < 0 ? "قەرزدارە" : rem > 0 ? "هەیەتی" : "",
      bg,
    };
  }, [totals]);

  const prevBalanceInfo = useMemo(() => {
    const prev = totals?.balanceBefore || 0;
    const numPrev = Number(prev);
    return {
      remain: Math.abs(numPrev),
      text: numPrev < 0 ? "قەرزدارە" : numPrev > 0 ? "هەیەتی" : "",
      bg: numPrev < 0 ? "rgb(255, 0, 0)" : numPrev > 0 ? "rgb(0, 125, 0)" : "",
    };
  }, [totals]);

  useEffect(() => {
    setBalanceNow(balanceInfo.remain);
    setDebDanText(balanceInfo.text);
    setDebDanBg(balanceInfo.bg);
    setDebDanBg(balanceInfo.bg);
  }, [balanceInfo]);

  useEffect(() => {
    dispatch(
      getAllCurrencies({ parPage, page: currentPage, searchValue: searchTerm }),
    );
  }, []);

  //   const calculateBalances = (
  //   movements: MovementState[],
  //   startingBalance: number,
  // ) => {
  //   let balance = startingBalance;
  //   return movements.map((m) => {
  //     // Convert to number in case they are strings (Prisma Decimal)
  //     const debit = m.debtorId > 0 ? Number(m.amountTaking) : 0;
  //     const credit = m.creditorId > 0 ? Number(m.amountPay) : 0;
  //     balance += credit - debit;
  //     return {
  //       ...m,
  //       balance: Math.abs(balance),
  //       status: balance < 0 ? "قەرزدارە" : balance > 0 ? "هەیەتی" : "",
  //     };
  //   });
  // };

  const calculateBalances = (
    movements: MovementState[],
    startingBalance: number,
  ) => {
    let balance = startingBalance;
    return movements.map((m) => {
      const debit = m.debtorId > 0 ? Number(m.amountTaking) : 0;
      const credit = m.creditorId > 0 ? Number(m.amountPay) : 0;
      balance += credit - debit;
      return {
        ...m,
        balance: Math.abs(balance),
        status: balance < 0 ? "قەرزدارە" : balance > 0 ? "هەیەتی" : "",
      };
    });
  };

  const startingBalance = totals?.balanceBefore || 0;

  const movementsWithBalance = useMemo(
    () => calculateBalances(movements || [], Number(startingBalance)),
    [movements, startingBalance],
  );

  // Compute opening row data
  const openingNet =
    (totals?.openingAmountPay || 0) - (totals?.openingAmountTaking || 0);
  const showOpeningRow = openingNet !== 0;
  const openingBalance = Math.abs(openingNet);
  const openingStatus =
    openingNet < 0 ? "قەرزدارە" : openingNet > 0 ? "هەیەتی" : "";
  const openingType = t("currencyS.balance_prev");
  const openingDate = fromDate ? formatLocalDate(fromDate) : "";

  // const startingBalance = 0;

  // const movementsWithBalance = useMemo(
  //   () => calculateBalances(movements || [], startingBalance),
  //   [movements, startingBalance],
  // );

  return (
    <div>
      {/* {loading ? (
        <LoadingSpinner />
      ) : ( */}
      <div className="px-2 pb-3 lg:px-4">
        <div className="flex items-center justify-between pb-3 ">
          <h2 className="text-base font-medium text-[#5c5a5a] ">
            {t("dashboard.Account statement")}
          </h2>{" "}
          {/* <span className="px-2">
            {totalorders} {t("orderS.installement")}
          </span> */}
        </div>
        <div className="relative  mb-2 bg-[#ffffff] px-4 py-2">
          {/* First element at start */}
          <div className="relative mb-5 mt-2 grid grid-cols-1  md:grid-cols-3 lg:grid-cols-4">
            <div className=" flex items-center   gap-2">
              {/* <label htmlFor="currencyId">{t("currencyS.currency_type")}</label> */}
              <h2 className="text-sm text-[#5c5a5a]">
                {t("currencyS.currency_type")}
              </h2>
              <select
                value={currencyState.currencyId || 0} // Controlled component
                onChange={handleExchangeCurrencyChange}
                // onChange={(e) => {
                //   const value = parseInt(e.target.value) || 0;
                //   setCurrencyState((prev) => ({
                //     ...prev,
                //     currencyId: value,
                //     currencyType:
                //       currencies?.find((c) => c.currencyId === value)
                //         ?.currency || "",
                //   }));
                //   setShowResults(false);
                // }}

                id="currencyId"
                className="rounded-md border border-slate-400 bg-[#ffffff] px-3 py-[3px] text-sm  text-[#000000] focus:border-secondary"
                required
              >
                <option value="">{t("currencyS.select_currency")}</option>
                {currencies?.map((currency) => (
                  <option
                    key={currency.id}
                    value={currency.currencyId} // Use actual currency ID
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

          <div
            ref={containerRef}
            className="relative mb-4  grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-2"
          >
            <div className="col-span-1 flex w-full">
              <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-1 lg:w-4/6 lg:grid-cols-3">
                <div className="flex   items-center gap-1 pb-2 lg:col-span-1 lg:flex-col">
                  <label
                    className="w-2/6 text-sm lg:w-full"
                    htmlFor="accountId"
                  >
                    {t("categoryS.account_id")}
                  </label>

                  <input
                    className="w-full rounded-md border border-gray-300 px-3 py-[6px] placeholder:text-xs"
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
                    // disabled={!isFormEnabled}
                    placeholder={t("categoryS.account_id")}
                    required
                  />
                </div>
                <div className="flex gap-1 pb-2  lg:col-span-2 lg:flex-col">
                  <label
                    className="w-2/6 text-sm lg:w-full"
                    htmlFor="customer_name"
                  >
                    {t("orderS.customer_name")}
                  </label>
                  <input
                    id="customer_name"
                    type="text"
                    className="w-full rounded-md border px-3 py-[6px] placeholder:text-xs"
                    value={searchTerm}
                    onChange={handleSearchChange} // now calling your debounce search logic
                    placeholder={t("currencyS.search_customer_name")}
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
            </div>
            <div className="grid grid-cols-1  gap-1 md:grid-cols-1 lg:grid-cols-3 lg:gap-1">
              <div className="flex items-center gap-1  lg:flex-col ">
                <h2 className="text-md px-4 text-[#5c5a5a]">
                  {t("currencyS.from_date")}
                </h2>
                <DatePicker
                  selected={fromDate}
                  onChange={handleFromDateChange}
                  id="from_date"
                  dateFormat="yyyy-MM-dd"
                  className="w-full rounded-md border border-gray-300 px-3 py-[6px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-start gap-1  lg:flex-col">
                {/* <label htmlFor="date">{t("currencyS.to_date")}</label> */}
                <h2 className="text-md px-4 text-[#5c5a5a]">
                  {t("currencyS.to_date")}
                </h2>
                <DatePicker
                  selected={toDate}
                  onChange={handleToDateChange}
                  id="to_date"
                  dateFormat="yyyy-MM-dd"
                  className="w-full rounded-md border border-gray-300 px-3 py-[6px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col items-center gap-4 md:flex-row">
            <div className="flex w-full flex-row items-center gap-1 md:w-auto">
              <h2 className="text-md whitespace-nowrap px-2 text-[#5c5a5a]">
                {t("currencyS.balance_prev")}
              </h2>
              <input
                className="input-field w-full rounded-md border border-gray-300 px-3 py-[6px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-auto"
                value={prevBalanceInfo.remain.toLocaleString("en-IQ", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                type="text"
                readOnly
              />
              <h2
                className="text-md whitespace-nowrap px-2 font-bold"
                style={{ color: prevBalanceInfo.bg }}
              >
                {prevBalanceInfo.text}
              </h2>
            </div>
            <div className="flex w-full flex-row items-center gap-1 md:w-auto">
              <h2 className="text-md whitespace-nowrap px-2 text-[#5c5a5a]">
                {t("currencyS.balance_now")}
              </h2>
              <input
                className="input-field w-full rounded-md border border-gray-300 px-3 py-[6px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-auto"
                value={balanceInfo.remain.toLocaleString("en-IQ", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                type="text"
                name="balance_now"
                id="balance_now"
                readOnly
              />
              <h2
                className="text-md whitespace-nowrap px-2 font-bold"
                style={{ color: debDanBg }}
              >
                {debDanText}
              </h2>
            </div>
          </div>
        </div>
        <div className="w-full rounded-md bg-[#ffffff] p-4 shadow-md">
          <div className="flex flex-col items-center justify-end  gap-2 pb-3 lg:flex-row lg:items-center">
            {/* First Row: Display */}
            <div className="flex items-center gap-2">
              <h2 className="text-md text-[#5c5a5a] ">
                {t("dashboardS.display")}
              </h2>
              <select
                onChange={(e) => setParPage(parseInt(e.target.value))}
                id="select"
                className="rounded-md border border-[#bcb9b9] bg-[#F9FBFE] px-4 py-0 text-[#5c5a5a] outline-none focus:border-[#bcb9b9]"
              >
                <option className="px-4" value="15">
                  15
                </option>
                <option className="px-4" value="30">
                  30
                </option>
                <option className="px-4" value="60">
                  60
                </option>
                <option className="px-4" value="100">
                  100
                </option>
                <option className="px-4" value="10000">
                  10000
                </option>
              </select>
            </div>
          </div>

          <div className="relative overflow-x-auto" dir={isRTL ? "rtl" : "ltr"}>
            <table
              className={`w-full text-sm ${
                isRTL ? "text-right" : "text-left"
              }  text-[#d0d2d6]`}
            >
              <thead className="border-b border-[#dcdada] bg-[#EEF2F7] text-xs uppercase text-[#5c5a5a]">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    {t("dashboardS.no")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("orderS.type")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("orderS.voucher_no")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("orderS.date")}
                  </th>

                  <th scope="col" className="px-4 py-3">
                    {t("orderS.debit")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("orderS.dane")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("orderS.balance")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("orderS.balance_type")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("currencyS.note")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {showOpeningRow && (
                  <tr className="border-b border-[#dcdada] bg-[#fdfdfd] text-base text-gray-400">
                    <td className="whitespace-nowrap px-4 py-2">0</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {openingType}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">-</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {openingDate.slice(0, 10)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {totals?.openingAmountTaking &&
                      totals.openingAmountTaking > 0
                        ? totals.openingAmountTaking.toLocaleString("en-IQ")
                        : 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {totals?.openingAmountPay && totals.openingAmountPay > 0
                        ? totals.openingAmountPay.toLocaleString("en-IQ")
                        : 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {openingBalance.toLocaleString("en-IQ")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {openingStatus}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {t("currencyS.balance_prev")}
                    </td>
                  </tr>
                )}
                {movementsWithBalance.map((o, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#f3f2f2] py-2 text-base text-[#595b5d]"
                  >
                    <td className="whitespace-nowrap px-4 py-2">{i + 1}</td>
                    <td className="whitespace-nowrap px-4 py-2">{o.type}</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {o.voucherNo}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {o?.createdAt
                        ? formatLocalDate(o.createdAt).slice(0, 10)
                        : ""}
                    </td>

                    <td className="whitespace-nowrap px-4 py-2">
                      {o.debtorId > 0 ? o.amountTaking : 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {o.creditorId > 0 ? o.amountPay : 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">{o.balance}</td>
                    <td className="whitespace-nowrap px-4 py-2">{o.status}</td>

                    <td className="whitespace-nowrap px-4 py-2">{o.note}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 text-base font-bold text-black">
                  <td colSpan={4} className="px-8 py-4 text-right">
                    {t("dashboardS.price")} :{" "}
                  </td>
                  <td className="px-4 py-2">
                    {currencyState.currencyId &&
                    currencyState.currencyId > 0 ? (
                      <>
                        {totals?.amountTaking?.toLocaleString("en-IQ")}{" "}
                        {totals?.amountTaking && totals.amountTaking > 0
                          ? currencyState.currency
                          : ""}
                      </>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    {currencyState.currencyId &&
                    currencyState.currencyId > 0 ? (
                      <>
                        {totals?.amountPay?.toLocaleString("en-IQ")}{" "}
                        {totals?.amountPay && totals.amountPay > 0
                          ? currencyState.currency
                          : ""}
                      </>
                    ) : null}
                  </td>
                </tr>
              </tfoot>
              {/* <tfoot>
                <tr className="bg-gray-100 text-lg font-bold text-black">
                  <td colSpan={4} className="px-8 py-4 text-right">
                    {t("dashboardS.price")} :{" "}
                  </td>
                  <td className="px-4 py-2">
                    {currencyState.currencyId &&
                    currencyState.currencyId > 0 ? (
                      <>
                        {totals?.movementAmountTaking?.toLocaleString("en-IQ")}{" "}
                        {totals?.movementAmountTaking &&
                        totals.movementAmountTaking > 0
                          ? currencyState.currency
                          : ""}
                      </>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    {currencyState.currencyId &&
                    currencyState.currencyId > 0 ? (
                      <>
                        {totals?.movementAmountPay?.toLocaleString("en-IQ")}{" "}
                        {totals?.movementAmountPay &&
                        totals.movementAmountPay > 0
                          ? currencyState.currency
                          : ""}
                      </>
                    ) : null}
                  </td>
                </tr>
              </tfoot> */}
            </table>
          </div>

          {pagination.total <= parPage ? null : (
            <div className="bottom-4 right-4 mt-4 flex w-full justify-end">
              <Pagination
                pageNumber={currentPage}
                setPageNumber={setCurrentPage}
                totalItem={pagination.total}
                parPage={parPage}
                showItem={Math.floor(pagination.total / parPage + 2)}
              />
            </div>
          )}
        </div>
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
      {/* {isAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-6/12 max-w-4xl rounded-lg bg-white px-6 py-3">
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

 
              <div className="max-h-full overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-lightBlue">
                    <tr>
                  
                      <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                        {t("categoryS.account_id")}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                        {t("categoryS.account_name")}
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
                          onClick={() => handleModalAccountSelect(account)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                        
                          <td className="whitespace-nowrap px-6 py-2 text-center text-sm text-gray-900">
                            {account.accountId}
                          </td>
                          <td className="whitespace-nowrap px-6  py-2 text-center text-sm text-gray-900">
                            {account.name}
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
  );
};

export default Movements;
