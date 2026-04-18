import { useAppDispatch } from "@/store/hooks";
import { getAllCurrencies } from "@/store/Reducers/currencyReducer";
import { getGeneralBalance } from "@/store/Reducers/movementReducer";
import { RootState } from "@/store/rootReducers";
import { Loader2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BiPrinter } from "react-icons/bi";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";

interface BalanceAccount {
  accountId: number;
  accountName: string;
  netBalance: string;
  status: "creditor" | "debtor";
}

const GeneralBalance: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === "ar" || currentLanguage === "kr";
  const [currencyId, setCurrencyId] = useState<number>(1); // default: USD=1 or IQD=2
  const voucherRef = useRef<HTMLDivElement>(null);

   const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchValue, setSearchValue] = useState<string>("");
    const [parPage, setParPage] = useState<number>(10);

  const handlePrint = useReactToPrint({
    contentRef: voucherRef, // instead of content: () => ref.current
    documentTitle: "Receipt",
    pageStyle: `
      @page { size: A4; margin: 30mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
      }
    `,
  });

  const { generalBalances, loader, errorMessage } = useSelector(
    (state: RootState) => state.movement,
  );

  const { currencies } = useSelector((state: RootState) => state.currency);

  useEffect(() => {
    const obj = { parPage: 10, page: 1, searchValue: "" };
    dispatch(getAllCurrencies(obj));
  }, [dispatch]);

const selectedCurrency = currencies.find(c => c.currencyId === currencyId);
  const currencySymbol = selectedCurrency?.currencySymbol;
  
 useEffect(() => {
  dispatch(getGeneralBalance({
    currencyId,
    fiscalYear: new Date().getFullYear(),
    // fromDate: startDate,
    // toDate: endDate,
    // searchValue: searchTerm,
    // includeZero: showZero,
    page: currentPage,
    parPage: parPage,
    sortBy: 'accountName',
    sortOrder: 'asc',
  }));
}, [currencyId,  currentPage, parPage, dispatch]);

  

  return (
    <div className="px-2 pb-5 lg:px-4">
      {/* Page Header */}

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="font-md text-md text-gray-800">
          {t("dashboard.General Balance")}
        </h1>

        {/* Currency Dropdown */}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 rounded bg-red-100 px-4 py-2 text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Loading State */}
      {loader ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="w-full rounded-md bg-[#ffffff] p-4 shadow-md">
          <div className="flex flex-col items-start justify-between gap-2 pb-4 lg:flex-row lg:items-center">
          <div className="flex text-sm w-full items-center gap-3 lg:w-auto">
            <label  htmlFor="currencyId">{t("currencyS.currency_type")}</label>
            <select
              value={currencyId}
              onChange={(e) => setCurrencyId(parseInt(e.target.value) || 0)}
              id="currencyId"
              className="rounded-md border border-slate-400 bg-[#ffffff] px-3 py-1 text-sm font-medium text-[#000000] focus:border-secondary"
              required
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
            <button
              onClick={handlePrint}
              className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2 font-medium text-white hover:bg-secondary hover:text-black disabled:opacity-75 md:w-auto"
            >
              <BiPrinter size={18} /> {t("home.print")}
            </button>
           </div>
          <div
            ref={voucherRef}
            className="overflow-x-auto print:block print:p-6"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="mb-4 hidden text-center print:block">
              <h1 className="text-xl font-bold">Exchange</h1>
              <p className="text-sm">Erbil, Iraq • +964 770 000 0000</p>
              <p className="text-sm">{t("dashboard.General Balance")}</p>
              <hr className="my-2 border-gray-400" />
            </div>
            <table
              className={`w-full text-sm 
              ${isRTL ? "text-right" : "text-left"} 
            text-[#d0d2d6]`}
            >
              <thead className="border-b border-[#dcdada] bg-[#EEF2F7] text-xs text-[#5c5a5a]">
                <tr>
                  <th className="px-4 py-2">{t("categoryS.account_id")}</th>
                  <th className="px-4 py-2">{t("orderS.name")}</th>
                  <th className="px-4 py-2">{t("orderS.debit")}</th>
                  <th className="px-4 py-2">{t("orderS.dane")}</th>
                </tr>
              </thead>

              <tbody>
                {generalBalances.length > 0 ? (
  generalBalances.map((acc) => (
    <tr
      key={acc.accountId}
      className="border-b border-[#dcdada] py-1 text-base text-[#595b5d]"
    >
      <td className="whitespace-nowrap px-4 py-1">
        {acc.accountId}
      </td>
      <td className="whitespace-nowrap px-4 py-1">
        {acc.accountName}
      </td>

      {/* Debtor column - also show neutral balances here (optional) */}
      <td className="whitespace-nowrap px-4 py-1 font-semibold text-red-600">
        {(acc.status === "debtor" || acc.status === "neutral") && (
          `${acc.netBalance} ${currencySymbol}`
        )}
      </td>

      {/* Creditor column */}
      <td className="whitespace-nowrap px-4 py-1 font-semibold text-green-600">
        {acc.status === "creditor" && (
          `${acc.netBalance} ${currencySymbol}`
        )}
      </td>
    </tr>
  ))
) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center italic text-gray-500"
                    >
                      No balances found for this currency.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Footer with totals */}
              {generalBalances.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 text-base font-bold text-black">
                    <td colSpan={2} className="px-8 py-2 text-left">
                      {t("dashboardS.price")} :
                    </td>
                    <td className="border-t px-4 py-3 text-red-600">
                      {generalBalances
                        .filter((acc) => acc.status === "debtor")
                        .reduce(
                          (sum, acc) =>
                            sum + Number(acc.netBalance.replace(/,/g, "")),
                          0,
                        )
                        .toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}{" "}
                      {currencySymbol}
                    </td>
                    <td className="border-t px-4 py-3 text-green-600">
                      {generalBalances
                        .filter((acc) => acc.status === "creditor")
                        .reduce(
                          (sum, acc) =>
                            sum + Number(acc.netBalance.replace(/,/g, "")),
                          0,
                        )
                        .toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}{" "}
                      {currencySymbol}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
      {/* {generalBalances <= parPage ? null : (
          <div className="bottom-4 right-4 mt-4 flex w-full justify-end">
            <Pagination
              pageNumber={currentPage}
              setPageNumber={setCurrentPage}
              totalItem={generalBalances}
              parPage={parPage}
              showItem={Math.floor(generalBalances / parPage + 2)}
            />
          </div>
        )} */}
    </div>
  );
};

export default GeneralBalance;
