import {
  AiFillCaretUp,
  AiOutlineDashboard,
  AiOutlineFileExcel,
  AiOutlineMenuFold,
  AiOutlineMenuUnfold,
  AiOutlinePartition,
  AiOutlineUsergroupAdd
} from 'react-icons/ai';
import {
  BiCategory,
  BiListOl,
  BiReceipt,
  BiSolidReport
} from 'react-icons/bi';

import { BsCurrencyDollar, BsCurrencyExchange, BsFileEarmarkBarGraph, BsListCheck, BsListTask } from 'react-icons/bs';
import { FaBalanceScale, FaBalanceScaleLeft, FaExchangeAlt, FaFileExport, FaFileImport, FaList, FaRegListAlt } from 'react-icons/fa';
import type { NavItem } from './types/navigation';


export const allNav: NavItem[] = [
  {
    id: 1,
    title: 'Dashboard',
    icon: AiOutlineDashboard,
    role: 'admin',
    path: '/dashboard',
  },
   {
    id: 2,
    title: 'Account Types',
    icon: AiOutlinePartition,
    role: 'admin',
    path: '/admin/dashboard/account-type',
  },
  {
    id: 3,
    title: 'Accounts',
    icon: BiCategory,
    role: 'admin',
    path: '/admin/dashboard/accounts',
  },
   {
    id: 4,
    title: 'Exchange USD',
    icon: BsCurrencyDollar,
    role: ['admin','manager'],
    path: '/admin/dashboard/exchange-usd',
  },
  {
    id: 5,
    title: 'Exchange All Currencies',
    icon: BsCurrencyExchange,
     role: ['admin','manager'],
    path: '/admin/dashboard/currencies-exchange',
  },
{
    id: 6,
    title: 'Send Transfer',
    icon: FaFileExport,
    role: 'admin',
    path: '/admin/dashboard/send-transfer',
  },
 {
    id: 7,
    title: 'Income Transfers',
    icon: FaFileImport,
    role: 'admin',
    path: '/admin/dashboard/income-transfers',
  },
   {
    id: 8,
    title: 'Payment',
    icon: AiFillCaretUp,
    role: 'admin',
    path: '/admin/dashboard/payment',
  },
{
    id: 9,
    title: 'Receipts',
    icon: BiReceipt,
    role: 'admin',
    path: '/admin/dashboard/receipts',
  },
  {
    id: 10,
    title: 'Qaid',
    icon: FaExchangeAlt,
    role: 'admin',
    path: '/admin/dashboard/qaid',
  },
{
    id: 11,
    title: 'Account statement',
    icon: BiSolidReport,
    role: 'admin',
    path: '/admin/dashboard/account-statement',
  },
{
    id: 12,
    title: 'General Balance',
    icon: FaBalanceScale,
    role: 'admin',
    path: '/admin/dashboard/general-balances',
  },


   {
    id: 13,
    title: 'Reports',
    icon: BsFileEarmarkBarGraph,
    role: 'admin',
    subNav: [
      {
        id: 101,
       title: 'Exchange USD List',
    icon: FaList,
    role: 'admin',
    path: '/admin/dashboard/exchange-usd-list',
      },
      {
        id: 102,
       title: 'Exchange Currencies List',
    icon: FaRegListAlt,
    role: 'admin',
    path: '/admin/dashboard/currencies-exchange-list',
      },
      {
        id:103,
        title: 'Send Transfer List',
    icon: BsListCheck,
    role: 'admin',
    path: '/admin/dashboard/send-transfer-list',
      },
      {
    id: 104,
    title: 'Cancelled Send Transfer',
    icon: AiOutlineFileExcel,
    role: 'admin',
    path: '/admin/dashboard/cancelled-send-transfers',
  },
 
  {
    id: 105,
    title: 'Income Transfers List',
    icon: BiListOl,
    role: 'admin',
    path: '/admin/dashboard/income-transfer-list',
  },
{
    id: 106,
    title: 'Cancelled Income Transfers',
    icon: BsListTask,
    role: 'admin',
    path: '/admin/dashboard/cancelled-income-transfers',
  },
  
   {
    id: 107,
    title: 'Paid Income Transfers',
    icon: BsListCheck,
    role: 'admin',
    path: '/admin/dashboard/paid-income-transfers',
  },
   
   {
    id: 108,
    title: 'Receipt List',
    icon: AiOutlineMenuUnfold,
    role: 'admin',
    path: '/admin/dashboard/receipt-list',
  },
 
   {
    id: 109,
    title: 'Payment List',
    icon: AiOutlineMenuFold,
    role: 'admin',
    path: '/admin/dashboard/payment-list',
  },
    ],
  },

  //  {
  //   id: 12,
  //   title: 'Exchange USD List',
  //   icon: FaList,
  //   role: 'admin',
  //   path: '/admin/dashboard/exchange-usd-list',
  // },
  
  // {
  //   id: 13,
  //   title: 'Exchange Currencies List',
  //   icon: FaRegListAlt,
  //   role: 'admin',
  //   path: '/admin/dashboard/currencies-exchange-list',
  // },
 
  // {
  //   id: 14,
  //   title: 'Send Transfer List',
  //   icon: BsListCheck,
  //   role: 'admin',
  //   path: '/admin/dashboard/send-transfer-list',
  // },
//    {
//     id: 15,
//     title: 'Cancelled Send Transfer',
//     icon: AiOutlineFileExcel,
//     role: 'admin',
//     path: '/admin/dashboard/cancelled-send-transfers',
//   },
 
//   {
//     id: 16,
//     title: 'Income Transfers List',
//     icon: BiListOl,
//     role: 'admin',
//     path: '/admin/dashboard/income-transfer-list',
//   },
// {
//     id: 17,
//     title: 'Cancelled Income Transfers',
//     icon: BsListTask,
//     role: 'admin',
//     path: '/admin/dashboard/cancelled-income-transfers',
//   },
  
//    {
//     id: 18,
//     title: 'Paid Income Transfers',
//     icon: BsListCheck,
//     role: 'admin',
//     path: '/admin/dashboard/paid-income-transfers',
//   },
   
//    {
//     id: 19,
//     title: 'Receipt List',
//     icon: AiOutlineMenuUnfold,
//     role: 'admin',
//     path: '/admin/dashboard/receipt-list',
//   },
 
   {
    id: 20,
    title: 'First Balance',
    icon:FaBalanceScaleLeft,
    role: 'admin',
    path: '/admin/dashboard/first-balance',
  },

   
{
    id: 21,
     title: 'Currencies',
    icon: BsCurrencyExchange,
    role: 'admin',
     path: '/admin/dashboard/currencies',
  },
  {
    id: 22,
     title: 'Users',
    icon: AiOutlineUsergroupAdd,
    role: 'admin',
     path: '/admin/dashboard/users',
  },


 
  
]
 