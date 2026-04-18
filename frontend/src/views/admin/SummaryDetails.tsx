import { useAppDispatch } from "@/store/hooks";
import { getDashboardSums } from "@/store/Reducers/dashboardReducer";
import { RootState } from "@/store/rootReducers";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

interface StatCardProps {
    color:string;
  title: string;
  iqd: number;
  usd: number;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ color,title, iqd, usd, icon }) => {
  // Format numbers with commas
  const formatNumber = (num: number) => num.toLocaleString("en-IQ");

  return (
    <div className="flex flex-col rounded-2xl bg-white shadow-md transition-all duration-200 hover:shadow-lg">
      <div className={`flex w-full rounded-t-2xl ${color} shadow-md transition-all duration-200 hover:shadow-lg`}>
        <p className="p-3 text-md text-white">{title}</p>
      </div>
       <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 p-6 flex items-center justify-between">
        <div>
          {/* IQD row */}
          <h2 className="text-xl font-bold text-gray-900">
            {formatNumber(iqd)}{" "}
            <span className="text-sm font-medium text-gray-500">IQD</span>
          </h2>

          {/* USD row */}
          <h2 className="text-xl font-bold text-gray-900">
            {formatNumber(usd)}{" "}
            <span className="text-sm font-medium text-gray-500">USD</span>
          </h2>
        </div>

        <div className="text-3lg rounded-full bg-blue-100 p-3 text-blue-600">
          {icon || "📊"}
        </div>
      </div>
    </div>
  );
};

const SummaryDetails: React.FC = () => {
  const { t } = useTranslation();
 const dispatch = useAppDispatch();

  const [fromDate, setFromDate] = useState<Date | null>();
  const [toDate, setToDate] = useState<Date | null>();

  const { data } = useSelector(
    (state: RootState) => state.dashboard,
  );

  useEffect(() => {
    dispatch(getDashboardSums({ fromDate: fromDate, toDate: toDate })); // no dates = totals
  }, [dispatch, fromDate, toDate]);

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

  // if (loader) {
  //   return <p className="text-center text-gray-500">Loading dashboard...</p>;
  // }

  // if (errorMessage) {
  //   return <p className="text-center text-red-500">{errorMessage}</p>;
  // }

  const filteredData = data?.filtered ?? {
    customerOrders: { IQD: 0, USD: 0 },
    carIncomes: { IQD: 0, USD: 0 },
    dailyImports: { IQD: 0, USD: 0 },
    payments: { IQD: 0, USD: 0 },
    receipts: { IQD: 0, USD: 0 },
    expenses: { IQD: 0, USD: 0 },
    contracts: { IQD: 0, USD: 0 },
  };

 const stats = [
  {
    color: "bg-Chocolate",
    title: t("dashboard.Installment Car"),
    iqd: filteredData.customerOrders.IQD,
    usd: filteredData.customerOrders.USD,
    icon: "📑",
  },
  {
    color: "bg-primary",
    title: t("dashboard.Import Car"),
    iqd: filteredData.carIncomes.IQD,
    usd: filteredData.carIncomes.USD,
    icon: "📦",
  },
  {
    color: "bg-Crimson",
    title: t("dashboard.Daily Import"),
    iqd: filteredData.dailyImports.IQD,
    usd: filteredData.dailyImports.USD,
    icon: "📦",
  },
  {
    color: "bg-LightSalmon",
    title: t("dashboard.Contract"),
    iqd: filteredData.contracts.IQD,
    usd: filteredData.contracts.USD,
    icon: "📝",
  },
  {
    color: "bg-SteelBlue",
    title: t("dashboard.Expenses"),
    iqd: filteredData.expenses.IQD,
    usd: filteredData.expenses.USD,
    icon: "💸",
  },
  {
    color: "bg-DarkOrchid",
    title: t("dashboard.Payment"),
    iqd: filteredData.payments.IQD,
    usd: filteredData.payments.USD,
    icon: "💰",
  },
  {
    color: "bg-MintCream",
    title: t("dashboard.Receipts"),
    iqd: filteredData.receipts.IQD,
    usd: filteredData.receipts.USD,
    icon: "🧾",
  },
];


  return (
    <div className="px-2 pb-5 lg:px-7">
      <div className="mb-6 grid  grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xlg:grid-cols-5 ">
        <div className="flex items-center pb-3">
          <h1 className="font-md  text-xl">{t("dashboard.Summary")}</h1>
        </div>
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            color={stat.color}
            title={stat.title}
            iqd={stat.iqd}
            usd={stat.usd}
            icon={stat.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default SummaryDetails;
