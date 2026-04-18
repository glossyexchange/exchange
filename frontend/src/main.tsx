// import React, { lazy, Suspense } from 'react';
// import ReactDOM from 'react-dom/client';
// import './index.css';
// import { BrowserRouter } from 'react-router-dom';
// import { Provider } from 'react-redux';
// import store from './store/index';
// import { Toaster } from 'react-hot-toast';
// import i18n from 'i18next'
// import { initReactI18next } from 'react-i18next'
// import LanguageDetector from 'i18next-browser-languagedetector'
// import HttpApi from 'i18next-http-backend'

// // eslint-disable-next-line react-refresh/only-export-components
// const App = lazy(() => import('./App'));

// // Get root element safely
// const rootElement = document.getElementById('root');
// if (!rootElement) throw new Error('Root element not found');

// // Module-level variable to store root instance
// let root: ReactDOM.Root | null = null;

// i18n
//   .use(initReactI18next)
//   .use(LanguageDetector)
//   .use(HttpApi)
//   .init({
//     // supportedLngs: ['en', 'kr', 'ar'],
//     supportedLngs: ['kr', 'ar'],
//     fallbackLng: 'kr',
//     detection: {
//       order: ['path', 'cookie', 'htmlTag', 'localStorage', 'subdomain'],
//       caches: ['cookie'],
//     },
//     backend: {
//       loadPath: '/assets/locales/{{lng}}/translation.json',
//     },
//   })

// function initApp() {
//   // Create root only if it doesn't exist
//   if (!root) {
//     root = ReactDOM.createRoot(rootElement!);
//   }

//   root.render(
//     <React.StrictMode>
//       <BrowserRouter>
//         <Provider store={store}>
//           <Suspense fallback={
//             <div className="h-screen w-full flex justify-center items-center">
//               <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
//             </div>
//           }>
//             <App />
//             <Toaster
//               toastOptions={{
//                 position: 'top-right',
//                 style: {
//                   background: '#283046',
//                   color: 'white',
//                 },
//               }}
//             />
//           </Suspense>
//         </Provider>
//       </BrowserRouter>
//     </React.StrictMode>
//   );
// }

// // Initialize the app
// initApp();

// // Handle HMR updates
// if (import.meta.hot) {
//   import.meta.hot.accept('./App', () => {
//     initApp();
//   });
// }

import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/index';
import { Toaster } from 'react-hot-toast';
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpApi from 'i18next-http-backend'

// eslint-disable-next-line react-refresh/only-export-components
const App = lazy(() => import('./App'));

// Get root element safely
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// Check for existing root in HMR data or initialize
let root: ReactDOM.Root | null = null;
if (import.meta.hot?.data.root) {
  root = import.meta.hot.data.root;
}

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(HttpApi)
  .init({
    supportedLngs: ['kr', 'ar'],
    fallbackLng: 'kr',
    detection: {
      order: ['path', 'cookie', 'htmlTag', 'localStorage', 'subdomain'],
      caches: ['cookie'],
    },
    backend: {
      loadPath: '/assets/locales/{{lng}}/translation.json',
    },
  });

function initApp() {
  // Create root only if it doesn't exist
  if (!root) {
    root = ReactDOM.createRoot(rootElement!);
  }

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Provider store={store}>
          <Suspense fallback={
            <div className="h-screen w-full flex justify-center items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
          }>
            <App />
            <Toaster
              toastOptions={{
                position: 'top-right',
                style: {
                  background: '#283046',
                  color: 'white',
                },
              }}
            />
          </Suspense>
        </Provider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

// Initialize the app
initApp();

// Handle HMR updates
if (import.meta.hot) {
  // Save root to HMR data before module is disposed
  import.meta.hot.dispose(() => {
    import.meta.hot!.data.root = root;
  });

  // Re-render app when `./App` updates
  import.meta.hot.accept('./App', () => {
    initApp();
  });
}