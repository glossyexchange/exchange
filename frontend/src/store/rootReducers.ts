import { combineReducers } from '@reduxjs/toolkit';
// import OrderReducer from './Reducers/OrderReducer';
// import PaymentReducer from './Reducers/PaymentReducer';
import accountReducer from './Reducers/accountReducer';
import accountTypeReducer from './Reducers/accountTypeReducer';
import authReducer from './Reducers/authReducer';
import currencyReducer from './Reducers/currencyReducer';
import dashboardReducer from './Reducers/dashboardReducer';
import exchangeAllReducer from './Reducers/exchangeAllReducer';
import exchangeReducer from './Reducers/exchangeReducer';
import firstBalanceReducer from './Reducers/firstBalanceReducer';
import incomeTransferReducer from './Reducers/incomeTransferReducer';
import movementReducer from './Reducers/movementReducer';
import paymentReducer from './Reducers/paymentReducer';
import qaidReducer from './Reducers/qaidReducer';
import receiptReducer from './Reducers/receiptReducer';
import sendTransferReducer from './Reducers/sendTransferReducer';
// import dashboardReducer from './Reducers/dashboardReducer';
// import productReducer from './Reducers/productReducer';
// import reklamReducer from './Reducers/reklamReducer';
// import shopReducer from './Reducers/shopReducer';

// Create the root reducer by combining all individual reducers
const rootReducer = combineReducers({
  auth: authReducer,
    account: accountReducer,
    accountType:accountTypeReducer,
    sendTransfer:sendTransferReducer,
    exchange:exchangeReducer,
    currency:currencyReducer,
receipt: receiptReducer,
movement:movementReducer,
incomeTransfer:incomeTransferReducer,
payment: paymentReducer,
exchangeAll: exchangeAllReducer,
  dashboard: dashboardReducer,
firstBalance: firstBalanceReducer,
  qaid: qaidReducer,
//   order: OrderReducer,
//   payment: PaymentReducer,
//   dashboard: dashboardReducer,
//   banner: bannerReducer,
});

// Export the root reducer type
export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;