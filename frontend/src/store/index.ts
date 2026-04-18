import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducers';

declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
  };
};
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

// Infer types from the store itself
export type AppDispatch = typeof store.dispatch;
export default store;


// // store/index.ts
// import { configureStore } from '@reduxjs/toolkit';
// import rootReducer from './rootReducers';
// import type { Middleware } from '@reduxjs/toolkit';

// declare const process: {
//   env: {
//     NODE_ENV: 'development' | 'production' | 'test';
//   };
// };


// // Create the store with proper typing
// const store = configureStore({
//   reducer: rootReducer,
//   middleware: (getDefaultMiddleware) => 
//     getDefaultMiddleware({
//       serializableCheck: false
//     }),
//   devTools: process.env.NODE_ENV !== 'production' // Enable only in development
// });

// // Export types based on the store
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

// export default store;