
import { PrivateRoute } from '@/navigation/types/routes';
import { lazy } from 'react';


// eslint-disable-next-line react-refresh/only-export-components
const AdminDashboard = lazy(() => import('@/views/admin/AdminDashboard'));
// const Orders = lazy(() => import('../../views/admin/Orders'));
// eslint-disable-next-line react-refresh/only-export-components
const Accounts = lazy(() => import('@/views/admin/Accounts'));
// eslint-disable-next-line react-refresh/only-export-components
const AccountType = lazy(() => import('@/views/admin/AccoutType'));
// eslint-disable-next-line react-refresh/only-export-components
const SendTransfer = lazy(() => import('@/views/admin/SendTransfer'));
const Currencies = lazy(() => import('@/views/admin/Currencies'));
const SendTransferList = lazy(() => import('../../views/admin/SendTransferList'));
const PaidIncomeTransfer = lazy(() => import('../../views/admin/PaidIncomeTransfer'));
const ReceiptList = lazy(() => import('../../views/admin/ReceiptList'));
const Movements = lazy(() => import('../../views/admin/Movements'));
const PaidIncomeTransfersList = lazy(() => import('../../views/admin/PaidIncomeTransfersList'));
const CancelledIncomeTransfers = lazy(() => import('../../views/admin/CancelledIncomeTransfers'));
const CancelledSendTransfers = lazy(() => import('../../views/admin/CancelledSendTransfers'));
const AddUser = lazy(() => import('../../views/admin/AddUser'));
const Reciept = lazy(() => import('../../views/admin/Reciept'));
const ExchangeUSD = lazy(() => import('../../views/admin/ExchangeUSD'));
const ExchangeUSDList = lazy(() => import('../../views/admin/ExchangeUSDList'));
const Qaid = lazy(() => import('../../views/admin/Qaid'));
const IncomeTransfers = lazy(() => import('../../views/admin/IncomeTransfers'));
const IncomeTransferstList = lazy(() => import('../../views/admin/IncomeTransferstList'));
// const EditContract = lazy(() => import('../../views/admin/EditContract'));
const Payments = lazy(() => import('../../views/admin/Payments'));

const PaymentList = lazy(() => import('../../views/admin/PaymentList'));
const ExchangeAllCurrency = lazy(() => import('../../views/admin/ExchangeAllCurrency'));
const ExchangeAllList = lazy(() => import('../../views/admin/ExchangeAllList'));
const FirstBalance = lazy(() => import('../../views/admin/FirstBalance'));
// const SummaryDetails = lazy(() => import('../../views/admin/SummaryDetails'));
const GeneralBalance = lazy(() => import('../../views/admin/GeneralBalance'));



export const adminRoutes: PrivateRoute[] = [
  {
    path: 'dashboard',
    element: <AdminDashboard />,
    // element: createElement(AdminDashboard),
    roles: ['admin','manager'],
  },
   {
    path: 'admin/dashboard/accounts',
    element: <Accounts />,
    roles: 'admin',
  },
   {
    path: 'admin/dashboard/account-type',
    element: <AccountType />,
    roles: 'admin',
  },
   {
    path: 'admin/dashboard/exchange-usd/:fiscalYear?/:voucherNo?',
    element: <ExchangeUSD />,
     roles: ['admin','manager'],
  },
  {
    path: 'admin/dashboard/exchange-usd-list',
    element: <ExchangeUSDList />,
    roles: 'admin',
  },
 {
    path: 'admin/dashboard/currencies-exchange/:fiscalYear?/:voucherNo?',
    element: <ExchangeAllCurrency />,
     roles: ['admin','manager'],
  },
   {
    path: 'admin/dashboard/currencies-exchange-list',
    element: <ExchangeAllList />,
    roles: 'admin',
  },

  
    {
    path: 'admin/dashboard/send-transfer/:fiscalYear?/:voucherNo?',
    element: <SendTransfer />,
    roles: 'admin',
  },
  {
    path: 'admin/dashboard/send-transfer-list',
    element: <SendTransferList />,
    roles: 'admin',
  },
  {
    path: 'admin/dashboard/cancelled-send-transfers',
    element: <CancelledSendTransfers />,
    roles: 'admin',
  },
  {
    path: 'admin/dashboard/currencies',
    element: <Currencies />,
    roles: 'admin',
  },
  {
    path: 'admin/dashboard/receipts/:fiscalYear?/:voucherNo?',
    element: <Reciept />,
    roles: 'admin',
  },
{
    path: 'admin/dashboard/receipt-list',
    element: <ReceiptList />,
    roles: 'admin',
  },
 {
  path:'/admin/dashboard/payment/:fiscalYear?/:voucherNo?',
    // path: 'admin/dashboard/payment/:voucherNo?',
    element: <Payments />,
    roles: 'admin',
  },

{
    path: 'admin/dashboard/payment-list',
    element: <PaymentList />,
    roles: 'admin',
  },

  {
    path: 'admin/dashboard/qaid',
    element: <Qaid />,
    roles: 'admin',
  },

   {
    path: 'admin/dashboard/first-balance',
    element: <FirstBalance />,
    roles: 'admin',
  },
  
  {
    path: 'admin/dashboard/account-statement',
    element: <Movements />,
    roles: 'admin',
  },
  //  {
  //   path: 'admin/dashboard/summary',
  //   element: <SummaryDetails />,
  //   roles: 'admin',
  // },
  // {
  //   path: 'admin/dashboard/receipt-edit/:voucherNo',
  //   element: <InstallmentReceiptEdit />,
  //   roles: 'admin',
  // },
  // {
  //   path: 'admin/dashboard/sell-car-edit/:voucherNo',
  //   element: <SellCarEdit />,
  //   roles: 'admin',
  // },
  {
    path: 'admin/dashboard/users',
    element: <AddUser />,
    roles: 'admin',
  },
  // {
  //   path: 'admin/dashboard/import-car-edit/:voucherNo',
  //   element: <ImportCarEdit />,
  //   roles: 'admin',
  // },
{
    path: 'admin/dashboard/income-transfers/:fiscalYear?/:voucherNo?',
    element: <IncomeTransfers />,
    roles: 'admin',
  },
  {
    path: 'admin/dashboard/income-transfer-list',
    element: <IncomeTransferstList />,
    roles: 'admin',
  },

{
    path: 'admin/dashboard/cancelled-income-transfers',
    element: <CancelledIncomeTransfers />,
    roles: 'admin',
  },
  
   {
    path: 'admin/dashboard/paid-income-transfer/:fiscalYear?/:voucherNo?',
    element: <PaidIncomeTransfer />,
    roles: 'admin',
  },
    {
    path: 'admin/dashboard/paid-income-transfers',
    element: <PaidIncomeTransfersList />,
    roles: 'admin',
  },

 
  {
    path: 'admin/dashboard/general-balances',
    element: <GeneralBalance />,
    roles: 'admin',
  },
  
]
//   {
//     path: 'admin/orders',
//     element: <Orders />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/subcategory',
//     element: <SubCategory />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/add-product',
//     element: <AddProduct />,
//     roles: 'admin',
//   },
//   {
//     path: '/admin/dashboard/products',
//     element: <Products />,
//     roles: 'admin',
//   },
//   {
//     path: '/admin/dashboard/discount-product',
//     element: <DiscountProducts />,
//     roles: 'admin',
//   },
//   {
//     path: '/admin/dashboard/edit-product/:productId',
//     element: <EditProduct />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/edit-shop/:sellerId',
//     element: <EditShop />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/shops',
//     element: <Shops />,
//     roles: 'admin',
//   },
 
//   {
//     path: 'admin/dashboard/colors',
//     element: <ProductColors />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/product-properties',
//     element: <ProductProperty />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/banners',
//     element: <AddBanner />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/reklam',
//     element: <Reklam />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/payment-request',
//     element: <PaymentRequest />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/deactive-sellers',
//     element: <DeactiveSellers />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/printhouse',
//     element: <UserRequest />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/user/details/:userId',
//     element: <UserDetails />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/chat-sellers',
//     element: <ChatSeller />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/chat-sellers/:sellerId',
//     element: <ChatSeller />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/order/details/:orderId',
//     element: <OrderDetails />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/users',
//     element: <AddUser />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/customers',
//     element: <Customers />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/coupon',
//     element: <AddCoupon />,
//     roles: 'admin',
//   },
//   {
//     path: 'admin/dashboard/notifications',
//     element: <AddNotifications />,
//     roles: 'admin',
//   },
// ];