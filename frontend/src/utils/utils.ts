// import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { CSSProperties } from 'react'; // Only if used in React components

// Define type for overrideStyle
export const overrideStyle: CSSProperties = {
  display: 'flex',
  margin: '0 auto',
  height: '24px',
  justifyContent: 'center',
  alignItems: 'center',
};


export const accountTypeId = {
  QASA:100,
  
  EXPENSE:13,
  SALARY:16,

  ExchangeUsd_ID:8,
  ExchangeAll_ID:9,
  Hmula_ID:6,
  HawalaIncom_ID:7,
  RETAINED_EARNINGS_ACCOUNT_ID:203,
} as const;

// Define socket connection options type
// type SocketConnectionOptions = Partial<ManagerOptions & SocketOptions>;

// // Create socket connection with typed options
// export const socket: Socket = io('https://api.365promo.net', {
//   transports: ['websocket'],
//   withCredentials: true,
//   autoConnect: true,
//   reconnectionAttempts: 5,
// } as SocketConnectionOptions);