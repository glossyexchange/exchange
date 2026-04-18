import { useAppDispatch } from "@/store/hooks";

import { getAllCurrencies } from "@/store/Reducers/currencyReducer";
import {
  deleteReceipt,
  getAllReceipts,
  messageClear,
} from "@/store/Reducers/receiptReducer";
import { RootState } from "@/store/rootReducers";
import { ExchangeCurremciesState } from "@/types/exchangeAllTypes";
import { FORM_TYPES } from "@/types/formTypes";
import { Payments } from "@/types/receiptType";
import { formatLocalDate } from "@/utils/timeConvertor";
import React, { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Pagination from "../Pagination";

const ReceiptList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === "ar" || currentLanguage === "kr";
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchValue, setSearchValue] = useState<string>("");
  const [parPage, setParPage] = useState<number>(30);

  const [loading, setLoading] = useState<boolean>(true);
  // const [receiptTypeId, setReceiptTypeId] = useState<number>(0);

  const [state, setState] = useState<ExchangeCurremciesState>({
    exchangeTypeId: 0,
    exchangeType: "",
    currencyId: 0,
    currencyName: "",
  });

  const { successMessage, errorMessage, receipts, totalPayments } = useSelector(
    (state: RootState) => state.receipt,
  );
  const { currencies } = useSelector((state: RootState) => state.currency);
  // const { accounts } = useSelector((state: RootState) => state.account);

  // const { data: searchResults = [] } = useSelector(
  //   (state: RootState) => state.account.searchResults,
  // );

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

  const fetchReceipts = useCallback(() => {
    setLoading(true);
    return dispatch(
      getAllReceipts({
        parPage,
        page: currentPage,
        searchValue,
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
    state.currencyId,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  useEffect(() => {
    const obj = { parPage: 10, page: 1, searchValue: "" };
    dispatch(getAllCurrencies(obj));
  }, [dispatch]);

  const handleDeletePayment = (recipt: Payments) => {
    if (window.confirm(t("currencyS.delete_confirm") || "Are you sure?")) {
      dispatch(
        deleteReceipt({
          receiptId: recipt.id,
          formType: FORM_TYPES.RECEIPT,
          deleteReceipt: recipt,
        }),
      );
    }
  };

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
    // <div>
    //   {loading ? (
    //     <div></div>
    //   ) : (
    <div className="px-2 pb-5 lg:px-4">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-lg font-medium text-[#5c5a5a] ">
          {t("paymentS.receipt_list")}
        </h2>{" "}
        <span className="px-2">
          {totalPayments} {t("paymentS.receipt")}
        </span>
      </div>
      <div className="w-full rounded-md bg-[#ffffff] p-4 shadow-md">
        <div className="flex flex-col items-start justify-between gap-2 pb-3 lg:flex-row lg:items-center">
          {/* Currency filter */}
          <div className="flex w-full items-center gap-3 lg:w-auto">
            <label htmlFor="currencyId">{t("currencyS.currency_type")}</label>
            <select
              value={state.currencyId || 0}
              onChange={handleExchangeCurrencyChange}
              id="currencyId"
              className="rounded-md border border-slate-400 bg-[#ffffff] px-3 py-1 text-sm font-medium text-[#000000] focus:border-secondary"
              required
            >
              <option value="0">{t("currencyS.select_currency")}</option>
              {currencies?.map((currency) => (
                <option key={currency.currencyId} value={currency.currencyId}>
                  {currency.currency}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <h2 className="text-md text-[#5c5a5a]">{t("home.search_name")}</h2>
            <input
              onChange={(e) => setSearchValue(e.target.value)}
              value={searchValue}
              className="rounded-md border border-[#bcb9b9] bg-[#F9FBFE] px-4 py-1 text-[#5c5a5a] outline-none focus:border-[#bcb9b9]"
              type="text"
              id="search"
              name="search"
              placeholder="search"
            />
          </div>

          {/* Date filters */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
            <div className="flex items-center justify-center ">
              <h2 className="text-md px-2 text-[#5c5a5a]">
                {t("currencyS.from_date")}
              </h2>
              <DatePicker
                selected={fromDate}
                onChange={handleFromDateChange}
                id="from_date"
                dateFormat="yyyy-MM-dd"
                className="rounded-md border border-gray-300 p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-1 flex items-center justify-center ">
              <h2 className="text-md px-2 text-[#5c5a5a]">
                {t("currencyS.to_date")}
              </h2>
              <DatePicker
                selected={toDate}
                onChange={handleToDateChange}
                id="to_date"
                dateFormat="yyyy-MM-dd"
                className="rounded-md border border-gray-300 p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Display per page */}
          <div className="flex items-center gap-3">
            <h2 className="text-md text-[#5c5a5a] ">
              {t("dashboardS.display")}
            </h2>
            <select
              onChange={(e) => setParPage(parseInt(e.target.value))}
              id="select"
              className="rounded-md border border-[#bcb9b9] bg-[#F9FBFE] px-4 py-[1px]  text-[#5c5a5a] outline-none focus:border-[#bcb9b9]"
            >
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="60">60</option>
              <option value="100">100</option>
              <option value="10000">10000</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : receipts?.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {t("home.no_data_found")}
          </div>
        ) : (
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
                    {t("orderS.voucher_no")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("orderS.customer_name")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("categoryS.phone")}
                  </th>

                  <th scope="col" className="px-4 py-3">
                    {t("paymentS.receipt_amount")}
                  </th>
                  <th className="px-4 py-2">{t("currencyS.currency")}</th>
                  <th scope="col" className="px-4 py-3">
                    {t("orderS.date")}
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
                {receipts?.map((o, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#dcdada] py-2 text-base text-[#595b5d]"
                  >
                    <td className="whitespace-nowrap px-4  py-2">{i + 1}</td>
                    <td className="whitespace-nowrap px-4  py-2">
                      {o?.voucherNo}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">{o.payer}</td>

                    <td className="whitespace-nowrap px-4 py-2">
                      {o.payerPhone}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-2 text-base font-semibold 
                          
                        `}
                    >
                      {o.totalAmount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1">
                      {o.currencyType}{" "}
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
                          to={`/admin/dashboard/receipts/${o.fiscalYear}/${o.voucherNo}`}
                          className={`rounded bg-green-600 px-[8px] py-[8px] text-sm text-white hover:shadow-lg hover:shadow-[#2a629aab]`}
                        >
                          {" "}
                          <FaEdit />{" "}
                        </Link>
                        <Link
                          to={`/admin/dashboard/receipts/${o.fiscalYear}/${o.voucherNo}`}
                          className="rounded bg-primary px-[6px] py-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-primary"
                        >
                          {" "}
                          <FaEye />{" "}
                        </Link>
                        <button
                          onClick={() => handleDeletePayment(o)}
                          className="rounded bg-red-500 px-[6px] py-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-red-500/50"
                        >
                          {" "}
                          <FaTrash />{" "}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 text-base font-bold text-black">
                  <td colSpan={4} className="px-8 py-2 text-left">
                    {t("dashboardS.price")} :
                  </td>
                  <td className="px-2 py-2">
                    {state.currencyId > 0 ? (
                      <>
                        {receipts
                          .filter((p) => p.currencyId === state.currencyId)
                          .reduce((sum, p) => sum + Number(p.totalAmount), 0)
                          .toLocaleString("en-IQ", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                        {state.currencyName}
                      </>
                    ) : null}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {totalPayments <= parPage ? null : (
          <div className="bottom-4 right-4 mt-4 flex w-full justify-end">
            <Pagination
              pageNumber={currentPage}
              setPageNumber={setCurrentPage}
              totalItem={totalPayments}
              parPage={parPage}
              showItem={Math.floor(totalPayments / parPage + 2)}
            />
          </div>
        )}
      </div>
    </div>
    // )}
    // </div>
  );
};

export default ReceiptList;
