
import { PrivateRoute } from '@/navigation/types/routes';
import { lazy } from 'react';

const ExchangeUSD = lazy(() => import('../../views/admin/ExchangeUSD'));
const ExchangeAllCurrency = lazy(() => import('../../views/admin/ExchangeAllCurrency'));



export const managerRoutes: PrivateRoute[] = [

{
   path: 'dashboard/exchange-usd/:voucherNo?',
    element: <ExchangeUSD />,
    roles: 'manager',
  },
  {
  path: 'dashboard/currencies-exchange/:voucherNo?',
    element: <ExchangeAllCurrency />,
    roles: 'manager',
  },
];