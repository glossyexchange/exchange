import 'react-router';

declare module 'react-router' {
  interface State {
    orderData?: CustomerOrder;
  }
}