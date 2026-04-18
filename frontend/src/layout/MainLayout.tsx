import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
// import { socket } from '../utils/utils';
import { useSelector } from 'react-redux';
// import { updateCustomer, updateSellers } from '../store/Reducers/chatReducer';
// import { useTranslation } from 'react-i18next';
// import i18next from 'i18next';
import cookies from 'js-cookie';
import Sidebar from './Sidebar';

// Define Language type
type Language = {
  code: string;
  name: string;
  dir: 'ltr' | 'rtl';
  country_code: string;
  image: string;
};

const languages: Language[] = [
  {
    code: 'en',
    name: 'English',
    dir: 'ltr',
    country_code: 'en',
    image: '../../../images/language.png',
  },
  {
    code: 'kr',
    name: 'کوردی',
    dir: 'rtl',
    country_code: 'kr',
    image: '../../../images/kur.png',
  },
  {
    code: 'ar',
    name: 'عربي',
    dir: 'rtl',
    country_code: 'ar',
    image: '../../../images/kur.png',
  },
];

// Define UserInfo type
type UserInfo = {
  _id: string;
  role: string;
  // Add other user properties here if needed
};

// Define RootState type (modify according to your actual state structure)
type RootState = {
  auth: {
    userInfo: UserInfo | null;
  };
};

const MainLayout: React.FC = () => {
  const currentLanguageCode = cookies.get('i18next') || 'en';
  const currentLanguage = languages.find((l) => l.code === currentLanguageCode);

  const { userInfo } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const adminRoles = ['admin', 'superadmin', 'manager', 'editor'];
    
    if (userInfo && adminRoles.includes(userInfo.role)) {
      const emitAdminGroup = () => {
        // socket.emit('add_admin_group', userInfo._id, userInfo);
      };
      
      emitAdminGroup();
    //   socket.on('connect', emitAdminGroup);
      
      return () => {
        // socket.off('connect', emitAdminGroup);
      };
    }
  }, [userInfo]);

//   useEffect(() => {
//     // Add proper typing for the socket event data
//     socket.on('activeCustomer', (customers: unknown) => {
//       dispatch(updateCustomer(customers));
//     });
    
//     socket.on('activeSeller', (sellers: unknown) => {
//       dispatch(updateSellers(sellers));
//     });
    
//     // Cleanup function
//     return () => {
//       socket.off('activeCustomer');
//       socket.off('activeSeller');
//     };
//   }, [dispatch]);

  // const [showSidebar, setShowSidebar] = useState(true);
  // Initialize sidebar state based on screen size
  const [showSidebar, setShowSidebar] = useState(() => {
    // Check if window is defined (for SSR compatibility)
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // Open on desktop, closed on mobile/tablet
    }
    return true; // Default to true for SSR
  });

  // Handle screen resize to auto-close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowSidebar(false); // Auto-close on mobile/tablet
      } else {
        setShowSidebar(true); // Auto-open on desktop
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-[#F9FBFE] w-full min-h-screen">
      <Header showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
      <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />

      {/* Content shifts only on large screens (lg:) */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          currentLanguage?.dir === 'ltr'
            ? showSidebar 
              ? 'lg:ml-[260px]' 
              : 'lg:ml-0'
            : showSidebar 
              ? 'lg:mr-[260px]' 
              : 'lg:mr-0'
        } ${currentLanguage?.dir} pt-[95px]`}
      >
        <Outlet />
      </div>
    </div>
//     <div className="bg-[#F9FBFE] w-full min-h-screen">
//       <Header showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
//       <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
// <div
//         className={`transition-all duration-300 ease-in-out ${
//           showSidebar
//             ? currentLanguage?.dir === 'ltr'
//               ? 'ml-[260px]'
//               : 'mr-[260px]'
//             : 'ml-0 mr-0'
//         } ${currentLanguage?.dir} pt-[95px]`}
//       >
//         <Outlet />
//       </div>
     
//     </div>
  );
};

export default MainLayout;