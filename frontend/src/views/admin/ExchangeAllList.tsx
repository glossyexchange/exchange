import { useAppDispatch } from "@/store/hooks";
import { searchAccounts } from "@/store/Reducers/accountReducer";

import { RootState } from "@/store/rootReducers";

import { getAllCurrencies } from "@/store/Reducers/currencyReducer";
import {
  deleteExchangeAll,
  getAllExchanges,
  messageClear
} from "@/store/Reducers/exchangeAllReducer";
import { ExchangeCurremciesState } from "@/types/exchangeAllTypes";
import { FORM_TYPES } from "@/types/formTypes";
import { formatLocalDate } from "@/utils/timeConvertor";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { useConfirmation } from "../auth/useConfirmation";
import Pagination from "../Pagination";

const exchangeTypes = [
  { id: 1, type: "کڕین" },
  { id: 2, type: "فرۆشتن" },
];

const ExchangeAllList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === "ar" || currentLanguage === "kr";

  // State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchValue, setSearchValue] = useState<string>("");
  const [parPage, setParPage] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  

  const [state, setState] = useState<ExchangeCurremciesState>({
    exchangeTypeId: 0,
    exchangeType: "",
    currencyId: 0,
    currencyName: "",
  });

  const [debouncedSearchValue] = useDebounce(searchValue, 300);

  const {
    totalExchangeAll,
    exchangeAllCurrencies,
    successMessage,
    errorMessage,
  } = useSelector((state: RootState) => state.exchangeAll);
  const { currencies } = useSelector((state: RootState) => state.currency);

  const { data: searchResults = [] } = useSelector(
    (state: RootState) => state.account.searchResults,
  );

  const { isOpen, message, showConfirmation, hideConfirmation, confirm } =
        useConfirmation();

  

  const accountNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    searchResults.forEach((account) => {
      map[Number(account.accountId)] = account.name;
    });
    return map;
  }, [searchResults]);

 

  const handleExchangeTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;

    if (value === "0") {
      setState((prev) => ({ ...prev, exchangeTypeId: 0, exchangeType: "" }));
    } else {
      const numValue = parseInt(value);
      const selectedExchange = exchangeTypes.find((ex) => ex.id === numValue);
      setState((prev) => ({
        ...prev,
        exchangeTypeId: numValue,
        exchangeType: selectedExchange?.type || "",
      }));
    }
    // Trigger filter selection
    // setHasFilterSelected(true);
  };

  const handleExchangeCurrencyChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedId = e.target.value;

    if (selectedId === "0") {
      setState((prev) => ({
        ...prev,
        currencyId: 0,
        currencyName: "",
      }));
    } else {
      const numValue = parseInt(selectedId);
      const selectedCurrency = currencies?.find(
        (c) => c.currencyId === numValue,
      );

      setState((prev) => ({
        ...prev,
        currencyId: numValue,
        currencyName: selectedCurrency?.currency || "",
      }));
    }
    // Trigger filter selection
    // setHasFilterSelected(true);
  };

  
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

  const handleFromDateChange = (date: Date | null) => {
    if (!date) return setFromDate(null);
    setFromDate(setStartOfDay(date));
    // setHasFilterSelected(true);
  };

  const handleToDateChange = (date: Date | null) => {
    if (!date) return setToDate(null);
    setToDate(setEndOfDay(date));
    // setHasFilterSelected(true);
  };


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    // setHasFilterSelected(true);
  };

  useEffect(() => {
    const obj = { parPage: 10, page: 1, searchValue: "" };
    dispatch(getAllCurrencies(obj));
  }, []);

  const fetchExchangeAll = useCallback(() => {
    // if (!hasFilterSelected) {
    //   return;
    // }

    setLoading(true);
    return dispatch(
      getAllExchanges({
        parPage,
        page: currentPage,
        searchValue,
        exchangeTypeId: state.exchangeTypeId,
        currencyId: state.currencyId,
        fromDate,
        toDate,
      }),
    )
      .unwrap()
      .finally(() => {
        setLoading(false);
      });
  }, [
    dispatch,
    parPage,
    currentPage,
    searchValue,
    fromDate,
    toDate,
    state.exchangeTypeId,
    state.currencyId,
    // hasFilterSelected,
  ]);

  

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchExchangeAll();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [fetchExchangeAll]);

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
    dispatch(searchAccounts({ searchValue: debouncedSearchValue }));
  }, [debouncedSearchValue, dispatch]);

  const handleDeleteExchangeAll = (voucherNo: number) => {
 const exchangeAllToDelete = exchangeAllCurrencies.find(
      (p) => p.voucherNo === voucherNo,
    );
  if (!exchangeAllToDelete) {
    toast.error("Exchange All not found");
    return;
  }

  if (!exchangeAllToDelete.fiscalYear) {
    toast.error("Fiscal year information missing");
    return;
  }

  showConfirmation(t("sendTransfer.are_you_sure_to_delete"), () => {
   
    dispatch(
      deleteExchangeAll({
        voucherNo,
        fiscalYear: exchangeAllToDelete.fiscalYear,
        typeId: FORM_TYPES.EXCHANGEALL,
        deleteExchangeAll: exchangeAllToDelete, 
      })
    );
  });
};

  

 
  const { total1, total2 } = exchangeAllCurrencies.reduce(
    (acc, item) => {
      if (item.exchangeTypeId === 1) {
        acc.total1 += item.amountUsd;
      } else if (item.exchangeTypeId === 2) {
        acc.total2 += item.amountUsd;
      }
      return acc;
    },
    { total1: 0, total2: 0 },
  );

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  return (
    <div>
      <div className="px-3 pb-5 lg:px-3">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-lg font-medium text-[#5c5a5a] ">
            {t("dashboard.Exchange Currencies List")}
          </h2>{" "}
          <span className="px-2">
            {totalExchangeAll} {t("dashboard.Exchange")}
          </span>
        </div>
        <div className="w-full rounded-md bg-[#ffffff] p-4 shadow-md">
          <div className="flex flex-col gap-2 pb-3 lg:flex-row lg:items-center lg:justify-between lg:gap-1">
            {/* First Row: Order Type */}
            <div className="flex w-full flex-col items-center  gap-1 lg:w-auto">
              <div className="flex w-full items-center gap-3  lg:w-auto">
                <label className="px-3" htmlFor="currencyId">
                  {t("currencyS.currency_type")}
                </label>
                <select
                  value={state.currencyId || 0}
                  onChange={handleExchangeCurrencyChange}
                  id="currencyId"
                  className="w-full rounded-md border border-slate-400 bg-white px-4 py-[2px]  text-sm font-medium text-black focus:border-secondary lg:w-auto"
                  // required
                >
                  <option value="0">{t("currencyS.select_currency")}</option>
                  {currencies?.map((currency) => (
                    <option
                      key={currency.currencyId}
                      value={currency.currencyId}
                    >
                      {currency.currency}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex w-full items-center gap-3 lg:w-auto">
                <label htmlFor="exchangeTypeId">{t("dashboardS.type")}</label>
                <select
                  value={state.exchangeTypeId || 0}
                  onChange={handleExchangeTypeChange}
                  id="exchangeTypeId"
                  className="w-full rounded-md border border-slate-400 bg-white px-4 py-[2px] text-sm font-medium text-black focus:border-secondary lg:w-auto"
                  // required
                >
                  <option value="0">{t("orderS.select_type")}</option>
                  {exchangeTypes?.map((exchange) => (
                    <option key={exchange.id} value={exchange.id}>
                      {exchange.type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Second Row: Search */}
            <div className="flex w-full items-center gap-3 lg:w-auto">
              <h2 className="text-md text-[#5c5a5a]">
                {t("home.search_name")}
              </h2>
              <input
                onChange={handleSearchChange}
                // onChange={(e) => setSearchValue(e.target.value)}
                value={searchValue}
                className="w-full rounded-md border border-[#bcb9b9] bg-[#F9FBFE] px-4 py-1 text-[#5c5a5a] outline-none focus:border-[#bcb9b9] lg:w-auto"
                type="text"
                id="search"
                name="search"
                placeholder="search"
              />
            </div>

            <div className="grid grid-cols-1  md:grid-cols-1 lg:grid-cols-1 ">
              <div className="flex items-center justify-center ">
                {/* <label htmlFor="date">{t("currencyS.from_date")}</label> */}
                <h2 className="text-md px-2 text-[#5c5a5a]">
                  {t("currencyS.from_date")}
                </h2>
                <DatePicker
                  selected={fromDate}
                  onChange={handleFromDateChange}
                  id="from_date"
                  // showTimeSelect
                  // timeFormat="HH:mm"
                  // timeIntervals={15}
                  dateFormat="yyyy-MM-dd"
                  className=" rounded-md border border-gray-300 p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mt-1 flex items-center justify-center ">
                {/* <label htmlFor="date">{t("currencyS.to_date")}</label> */}
                <h2 className="text-md px-2 text-[#5c5a5a]">
                  {t("currencyS.to_date")}
                </h2>
                <DatePicker
                  selected={toDate}
                  onChange={handleToDateChange}
                  id="to_date"
                  // showTimeSelect
                  // timeFormat="HH:mm"
                  // timeIntervals={15}
                  dateFormat="yyyy-MM-dd"
                  className="input-field rounded-md border border-gray-300 p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col "></div>
            </div>
            {/* Third Row: Display */}
            <div className="flex w-full items-center gap-3 lg:w-auto">
              <h2 className="text-md text-[#5c5a5a]">
                {t("dashboardS.display")}
              </h2>
              <select
                onChange={(e) => setParPage(parseInt(e.target.value))}
                id="select"
                className="w-full rounded-md border border-slate-400 bg-white px-3 py-[2px] text-sm font-medium text-black focus:border-secondary lg:w-auto"
              >
                <option value="30">30</option>
                <option value="60">60</option>
                <option value="100">100</option>
                <option value="10000">1000</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : exchangeAllCurrencies?.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {t("home.no_data_found")}
            </div>
          ) : (
            <div
              className="relative overflow-x-auto"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <table
                className={`w-full text-sm ${
                  isRTL ? "text-right" : "text-left"
                }  text-[#d0d2d6]`}
              >
                <thead className="border-b border-[#dcdada] bg-[#EEF2F7] text-sm uppercase text-[#5c5a5a]">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      {t("dashboardS.no")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("currencyS.voucher_no")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("categoryS.account_name")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("dashboardS.type")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("home.currency_amount")}{" "}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("currencyS.currency_price")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("home.usd_amount")}
                    </th>

                    <th scope="col" className="px-4 py-3">
                      {t("importCarS.import_date")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("currencyS.note")}
                    </th>
                    <th
                      scope="col"
                      className="flex items-center justify-end px-4 py-3"
                    >
                      {t("dashboardS.action")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {exchangeAllCurrencies?.map((o, i) => (
                    <tr
                      key={i}
                      className="border-b border-[#dcdada] py-2 text-lg text-[#595b5d]"
                    >
                      <td className="whitespace-nowrap px-4  py-2">{i + 1}</td>
                      <td className="whitespace-nowrap px-4  py-2">
                        {o.voucherNo}{" "}
                      </td>
                      <td>
                        {o.accountId
                          ? accountNameMap[Number(o.accountId)] ||
                            "Account not found"
                          : "N/A"}
                      </td>

                      <td className="whitespace-nowrap px-4  py-2">
                        {o?.exchangeType}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-base font-semibold ">
                        {o.amountUsd}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">{o.price}</td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {o.amountIqd}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2">
                        {o?.createdAt
                          ? formatLocalDate(o.createdAt).slice(0, 10)
                          : ""}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">{o.note}</td>

                      <td className="whitespace-nowrap px-4  py-2">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/admin/dashboard/currencies-exchange/${o.fiscalYear}/${o.voucherNo}`}
                            className="rounded bg-green-600  px-[8px] py-[6px] text-sm text-white hover:shadow-lg hover:shadow-[#2a629aab]"
                          >
                            {" "}
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDeleteExchangeAll(o.voucherNo)}
                            className="rounded bg-red-500 px-[6px] py-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-red-500/50"
                          >
                            {" "}
                            <FaTrash />{" "}
                          </button>
                          {/* </>
                        )} */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 text-lg font-bold text-black">
                    {/* Label */}
                    <td
                      colSpan={2}
                      className="px-2 py-4 text-left text-green-700"
                    >
                      {t("home.total_buy")} :
                    </td>

                    {/* Total Orders under column 5 */}
                    <td className="px-2 py-4 text-right text-green-700">
                      {state.currencyId && state.currencyId > 0 ? (
                        <>
                        
                        {total1.toLocaleString("en-IQ", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {total1 > 0 ? `${state.currencyName}` : ""}
                        </>
                      ):null}
                    </td>
                    <td className="px-2 py-4 text-left text-red-700">
                      {t("home.total_sale")} :
                    </td>

                    {/* Total for Type 2 */}
                    <td className="px-2 py-4 text-right text-red-700">
                       {state.currencyId && state.currencyId > 0 ? (
                        <>
                        
                        {total2.toLocaleString("en-IQ", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {total2 > 0 ? `${state.currencyName}` : ""}
                        </>):null}
                    </td>

                    {/* <tr className="bg-gray-200 text-lg font-bold text-black"> */}
                    <td className="px-2 py-4 text-left">
                      {" "}
                      {t("dashboardS.price")} :
                    </td>
                    <td className="px-2 py-4 text-right">
                       {state.currencyId && state.currencyId > 0 ? (
                        <>
                        
                        {total1 - total2 === 0
                          ? `${Math.abs(total1 - total2).toLocaleString("en-IQ", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : `${Math.abs(total1 - total2).toLocaleString("en-IQ", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} ${state.currencyName} ${
                              total1 - total2 > 0
                                ? t("home.purchase")
                                : t("home.sale")
                            }`}
                        </>):null}
                    </td>
                    {/* </tr> */}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {totalExchangeAll <= parPage ? null : (
            <div className="bottom-4 right-4 mt-4 flex w-full justify-end">
              <Pagination
                pageNumber={currentPage}
                setPageNumber={setCurrentPage}
                totalItem={totalExchangeAll}
                parPage={parPage}
                showItem={Math.floor(totalExchangeAll / parPage + 2)}
              />
            </div>
          )}
        </div>
      </div>
       {renderConfirmationModal()}
    </div>
  );
};

export default ExchangeAllList;
