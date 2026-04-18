import { useAppDispatch } from "@/store/hooks";
import { getAllCurrencies } from "@/store/Reducers/currencyReducer";

import {
  deletePaidIncomeTransferByVoucherNo,
  getPaidIncomeTransfers,
  messageClear,
} from "@/store/Reducers/incomeTransferReducer";
import { RootState } from "@/store/rootReducers";
import { FORM_TYPES } from "@/types/formTypes";
import { IncomeTransferListState } from "@/types/incomeTransferType";
import { formatLocalDate, getCurrentTime } from "@/utils/timeConvertor";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FaBan } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useConfirmation } from "../auth/useConfirmation";
import Pagination from "../Pagination";

const PaidIncomeTransfersList: React.FC = () => {
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

  const [state, setState] = useState<IncomeTransferListState>({
    currencyId: 0,
    currencyName: "",
  });

  const { isOpen, message, showConfirmation, hideConfirmation, confirm } =
    useConfirmation();

  const {
    paidIncomeTransfers,
    totalPaidTransfers,
    successMessage,
    errorMessage,
  } = useSelector((state: RootState) => state.incomeTransfer);
  const { currencies } = useSelector((state: RootState) => state.currency);

  const fetchSendTransfers = useCallback(() => {
    setLoading(true);
    return dispatch(
      getPaidIncomeTransfers({
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
    fromDate,
    toDate,
    state.currencyId,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSendTransfers();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [fetchSendTransfers]);


  

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
  };

  const handleToDateChange = (date: Date | null) => {
    if (!date) return setToDate(null);
    setToDate(setEndOfDay(date));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  useEffect(() => {
    const obj = { parPage: 10, page: 1, searchValue: "" };
    dispatch(getAllCurrencies(obj));
  }, []);

  function isOnOrAfterTenthOfNextMonth(targetDate: moment.MomentInput) {
    if (!targetDate) return false;

    const lastPayDate = moment.utc(targetDate, "YYYY");
    if (!lastPayDate.isValid()) return false;

    // Calculate due date (10th of next month at same time)
    const dueDate = lastPayDate.clone().add(1, "years").date(2);

    // Get current time in UTC+3
    const now = moment(getCurrentTime());

    return now.isSameOrAfter(dueDate);
  }

  const totalTransfer = paidIncomeTransfers.reduce(
    (sum, o) => sum + o.AmountTransfer,
    0,
  );

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

  const handleDeleteIncomeTransfer = (voucherNo: number) => {
     const paidIncomeTransferToDelete = paidIncomeTransfers.find(
      (p) => p.voucherNo === voucherNo,
    );
  
      if (!paidIncomeTransferToDelete) {
        toast.error("Payment not found");
        return;
      }
  
      if (!paidIncomeTransferToDelete.fiscalYear) {
      toast.error("Fiscal year information missing");
      return;
    }
  
  
      showConfirmation(t("sendTransfer.are_you_sure_to_cancel"), () => {
        dispatch(
          deletePaidIncomeTransferByVoucherNo({
            voucherNo,
            fiscalYear: paidIncomeTransferToDelete.fiscalYear,
            typeId: FORM_TYPES.PAIDINCOMETRANSFER,
            deletePaidIncomeTransfer: paidIncomeTransferToDelete,
          }),
        );
      });
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
    <div>
      <div className="px-2 pb-5 lg:px-4">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-lg font-medium text-[#5c5a5a] ">
            {t("sendTransfer.paid_income_transfers")}
          </h2>{" "}
          <span className="px-2">
            {totalPaidTransfers} {t("sendTransfer.paid_transfers")}
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
            </div>

            {/* Second Row: Search */}
            <div className="flex w-full items-center gap-3 lg:w-auto">
              <h2 className="text-md text-[#5c5a5a]">
                {t("home.search_name")}
              </h2>
              <input
                onChange={handleSearchChange}
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
                <h2 className="text-md px-2 text-[#5c5a5a]">
                  {t("currencyS.from_date")}
                </h2>
                <DatePicker
                  selected={fromDate}
                  onChange={handleFromDateChange}
                  id="from_date"
                  dateFormat="yyyy-MM-dd"
                  className=" rounded-md border border-gray-300 p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-md border border-slate-400 bg-white px-3 py-[2px]  text-sm font-medium text-black focus:border-secondary lg:w-auto"
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
          ) : paidIncomeTransfers?.length === 0 ? (
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
                      {t("orderS.voucher_no")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("sendTransfer.receiver_person")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("categoryS.address")}
                    </th>

                    <th scope="col" className="px-4 py-3">
                      {t("categoryS.phone")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("sendTransfer.total_amount_received")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("sendTransfer.sender_person")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("categoryS.address")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("categoryS.phone")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("sendTransfer.sender_name")}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t("orderS.date")}
                    </th>

                    <th
                      scope="col"
                      className="flex items-center justify-center px-4 py-3"
                    >
                      {t("dashboardS.action")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paidIncomeTransfers?.map((o, i) => (
                    <tr
                      key={i}
                      className={`border-b border-[#dcdada] py-2 text-lg text-[#595b5d] ${
                        isOnOrAfterTenthOfNextMonth(o.createdAt)
                          ? "bg-red-500 text-white"
                          : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4  py-2">{i + 1}</td>

                      <td className="whitespace-nowrap px-4  py-2">
                        {o?.voucherNo}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {o.RecieverPerson}
                      </td>
                      <td className="whitespace-nowrap px-4  py-2">
                        {o.RecieverAddress}{" "}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-2 text-base font-semibold 
                            
                        `}
                      >
                        {o.RecieverPhone}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {o.AmountTransfer.toLocaleString("en-IQ", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {/* {state.currencyName} */}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {o.SenderPerson}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {o.SenderAddress}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2">
                        {o.SenderPhone}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {o.sender?.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {o?.createdAt
                          ? formatLocalDate(o.createdAt).slice(0, 10)
                          : ""}
                      </td>

                      <td className="whitespace-nowrap px-4  py-2">
                        <div className="flex items-center justify-end gap-3">
                         {/* <Link
                            to={`/admin/dashboard/paid-income-transfer/${o.fiscalYear}/${o.incomeVoucherNo}?account=${o.account?.accountId??0}?payType=2`}
                            className={`rounded bg-primary px-[8px] py-[6px] text-sm text-white hover:shadow-lg hover:shadow-[#2a629aab]`}
                          >
                            <FaEye />
                          </Link>
                          <Link
                             to={`/admin/dashboard/paid-income-transfer/${o.fiscalYear}/${o.incomeVoucherNo}?account=${o.account?.accountId??0}`}
                            className={`rounded bg-green-600 px-[8px] py-[6px] text-sm text-white hover:shadow-lg hover:shadow-[#2a629aab]`}
                          >
                            {" "}
                            <FaEdit />
                          </Link>
                          */}
                          <button
                            onClick={() => {
                              if (o.currency?.currency) {
                                handleDeleteIncomeTransfer(
                                  o.voucherNo
                                );
                              } else {
                                toast.error("Currency information is missing");
                              }
                            }}
                            className="rounded bg-red-500 px-[6px] py-[6px] text-[#e8ebed] hover:shadow-lg hover:shadow-red-500/50"
                          >
                            {" "}
                            <FaBan />{" "}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 text-lg font-bold text-black">
                    {/* Label */}
                    <td colSpan={5} className="px-8 py-4 text-right">
                      {t("dashboardS.price")} :
                    </td>

                    {/* Total Orders under column 5 */}
                    <td className="px-2 py-2">
                      {state.currencyId && state.currencyId > 0 ? (
                        <>
                          {totalTransfer.toLocaleString("en-IQ", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {totalTransfer > 0 ? `${state.currencyName}` : ""}
                        </>
                      ) : null}
                    </td>

                    {/* Empty column 6 */}
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {totalPaidTransfers <= parPage ? null : (
            <div className="bottom-4 right-4 mt-4 flex w-full justify-end">
              <Pagination
                pageNumber={currentPage}
                setPageNumber={setCurrentPage}
                totalItem={totalPaidTransfers}
                parPage={parPage}
                showItem={Math.floor(totalPaidTransfers / parPage + 2)}
              />
            </div>
          )}
        </div>
      </div>
      {renderConfirmationModal()}
    </div>
  );
};

export default PaidIncomeTransfersList;
