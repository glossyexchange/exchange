import CardLink from "@/layout/CardLink";
import React from "react";
import { useTranslation } from "react-i18next";


// const StatCard: React.FC<StatCardProps> = ({ title, iqd, usd, icon }) => {
//   // Format numbers with commas
//   const formatNumber = (num: number) => num.toLocaleString("en-IQ");

//   return (
//     <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 p-6 flex items-center justify-between">
//       <div>
//         <p className="text-sm pb-3 text-gray-500">{title}</p>

//         {/* IQD row */}
//         <h2 className="text-xl font-bold text-gray-900">
//           {formatNumber(iqd)}{" "}
//           <span className="text-sm font-medium text-gray-500">IQD</span>
//         </h2>

//         {/* USD row */}
//         <h2 className="text-xl font-bold text-gray-900">
//           {formatNumber(usd)}{" "}
//           <span className="text-sm font-medium text-gray-500">USD</span>
//         </h2>
//       </div>

//       <div className="p-3 rounded-full bg-blue-100 text-blue-600 text-3lg">
//         {icon || "📊"}
//       </div>
//     </div>
//   );
// };

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
//  const dispatch = useAppDispatch();


  // useEffect(() => {
  //   dispatch(getDashboardSums({})); // no dates = totals
  // }, [dispatch]);

 

  // if (loader) {
  //   return <p className="text-center text-gray-500">Loading dashboard...</p>;
  // }

  // if (errorMessage) {
  //   return <p className="text-center text-red-500">{errorMessage}</p>;
  // }


 const cardLink = [
  {
    color: "bg-blue-100",
    textColor:"text-black",
    title: t("dashboard.Exchange USD"),
    path: '/admin/dashboard/exchange-usd',
    icon: "/images/exchange.png",  // Changed to absolute path
  },
  {
   color: "bg-blue-100",
   textColor:"text-black",
    title: t("dashboard.Exchange All Currencies"),
    path: '/admin/dashboard/currencies-exchange',
    icon: "/images/exchange_all.png",  // Changed to absolute path
  },
  {
   color: "bg-blue-100",
   textColor:"text-black",
    title: t("dashboard.Receipts"),
    path: '/admin/dashboard/receipts',
    icon: "/images/receipt.png",  // Changed to absolute path
  },
  {
   color: "bg-blue-100",
   textColor:"text-black",
    title: t("dashboard.Payment"),
    path: '/admin/dashboard/payment',
    icon: "/images/payment.png",  // Changed to absolute path
  },
  {
    color: "bg-blue-100",
    textColor:"text-black",
    title: t("dashboard.Send Transfer"),
    path: '/admin/dashboard/send-transfer',
    icon: "/images/transfer.png",  // Changed to absolute path
  },
  {
    color: "bg-blue-100",
    textColor:"text-black",
    title: t("dashboard.Receiving Transfer"),
    path: '/admin/dashboard/income-transfers',
    icon: "/images/income.png",  // Changed to absolute path
  },
  {
    color: "bg-SteelBlue",
    textColor:"text-white",
    title: t("dashboard.Exchange USD List"),
    path: '/admin/dashboard/exchange-usd-list',
    icon: "/images/usd-list.png",  // Changed to absolute path
  },
  {
    color: "bg-SteelBlue",
    textColor:"text-white",
    title: t("dashboard.Exchange Currencies List"),
    path: '/admin/dashboard/currencies-exchange-list',
    icon: "/images/currencies-list.png",  // Changed to absolute path
  },
  {
    color: "bg-SteelBlue",
    textColor:"text-white",
    title: t("dashboard.Receipt List"),
    path: '/admin/dashboard/receipt-list',
    icon: "/images/receipt-list.png",  // Changed to absolute path
  },
   {
    color: "bg-SteelBlue",
    textColor:"text-white",
    title: t("dashboard.Payment List"),
    path: '/admin/dashboard/payment-list',
    icon: "/images/payment-list.png",  // Changed to absolute path
  },
  {
    color: "bg-SteelBlue",
    textColor:"text-white",
    title: t("dashboard.Send Transfer List"),
    path: '/admin/dashboard/send-transfer-list',
    icon: "/images/send-transfer.png",  // Changed to absolute path
  },
  {
    color: "bg-SteelBlue",
    textColor:"text-white",
    title: t("dashboard.Receiving Transfer List"),
    path: '/admin/dashboard/income-transfer-list',
    icon: "/images/income-transfer.png",  // Changed to absolute path
  },
  {
    color: "bg-primary",
    textColor:"text-white",
    title: t("dashboard.Cancelled Send Transfer"),
    path: '/admin/dashboard/cancelled-send-transfers',
    icon: "/images/cancelled-send-transfer.png",  // Changed to absolute path
  },
  {
    color: "bg-primary",
    textColor:"text-white",
    title: t("dashboard.Cancelled Income Transfers"),
    path: '/admin/dashboard/cancelled-income-transfers',
    icon: "/images/cancelled-income-transfer.png",  // Changed to absolute path
  },
   {
    color: "bg-primary",
    textColor:"text-white",
    title: t("dashboard.Paid Income Transfers"),
    path: '/admin/dashboard/paid-income-transfers',
    icon: "/images/paid-incomes.png",  // Changed to absolute path
  },
  {
  color: "bg-primary",
   textColor:"text-white",
    title: t("dashboard.Account statement"),
    path: '/admin/dashboard/account-statement',
    icon: "/images/account-statements.png",  // Changed to absolute path
  },
   {
   color: "bg-primary",
   textColor:"text-white",
    title: t("dashboard.General Balance"),
    path: '/admin/dashboard/general-balances',
    icon: "/images/balance.png",  // Changed to absolute path
  },
  {
   color: "bg-primary",
   textColor:"text-white",
    title: t("dashboard.Currencies"),
    path: '/admin/dashboard/currencies',
    icon: "/images/currencies.png",  // Changed to absolute path
  },
   {
 color: "bg-primary",
   textColor:"text-white",
    title: t("dashboard.Accounts"),
    path: '/admin/dashboard/accounts',
    icon: "/images/accounts.png",  // Changed to absolute path
  },
  {
   color: "bg-primary",
   textColor:"text-white",
    title: t("dashboard.Account Types"),
    path: '/admin/dashboard/account-type',
    icon: "/images/account-types.png",  // Changed to absolute path
  },
  {
   color: "bg-primary",
   textColor:"text-white",
    title: t("dashboard.Users"),
    path: '/admin/dashboard/users',
    icon: "/images/users.png",  // Changed to absolute path
  },
];


  return (
    <div className="px-4 pb-5 lg:px-5 ">
      <h1 className="text-xl font-md mb-4">{t("dashboard.Dashboard")}</h1>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-6 pb-6">
  {cardLink.map((card, idx) => (
    <CardLink 
      key={idx} 
      
      color={card.color} 
      title={card.title} 
      link={card.path} 
      img={card.icon} 
      textColor={card.textColor}
    />
  ))}
</div>
      
      {/* <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} title={stat.title} iqd={stat.iqd} usd={stat.usd} icon={stat.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
  {stats.map((stat, idx) => (
    <StatChartCard
      key={idx}
      title={stat.title}
      iqd={stat.iqd}
      usd={stat.usd}
      icon={stat.icon}
    />
  ))}
</div> */}
    </div>
  );
};

export default AdminDashboard;
