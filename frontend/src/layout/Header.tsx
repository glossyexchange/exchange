import React, { useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useAuth } from '@/context/AuthContext';
import i18next from 'i18next';
import cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';
import { FaList } from 'react-icons/fa';
import { IoMdArrowDropdown } from 'react-icons/io';
import { backend_url_img } from '../api/server';
// import { socket } from '../utils/utils';
// import { getCurrentTime } from '../utils/timeConvertor';
// import {
//   get_user_info,
//   add_notification,
//   update_auth_notification,
//   messageClear,
//   add_notification_poster,
//   add_notification_stock,
//   logout,
// } from '../store/Reducers/authReducer';

// Define types
interface Language {
  code: string;
  name: string;
  dir: 'ltr' | 'rtl';
  country_code: string;
  image: string;
}


interface HeaderProps {
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

// Languages array with type
const languages: Language[] = [
  {
    code: 'kr',
    name: 'کوردی',
    dir: 'rtl',
    country_code: 'kr',
    image: `${backend_url_img}/uploads/language/ku.png`,
  },
  {
    code: 'ar',
    name: 'عربي',
    dir: 'rtl',
    country_code: 'ar',
    image: `${backend_url_img}/uploads/language/ar.png`,
  },
];

const Header: React.FC<HeaderProps> = ({ showSidebar, setShowSidebar }) => {
  const currentLanguageCode = cookies.get('i18next') || 'kr';
  const currentLanguage = languages.find((l) => l.code === currentLanguageCode) || languages[0];
  const { t } = useTranslation();
  // const dispatch = useDispatch();
//   const navigate = useNavigate();
  
  const { user } = useAuth();



//   const [unseenCount, setUnseenCount] = useState(0);

//   useEffect(() => {
    // const handleStockUpdate = (data: any) => {
    //   if (!userInfo) return;
      
    //   if (userInfo.notifications) {
    //     const unseenNotifications = userInfo.notifications.filter(
    //       (notification) => notification.notification_status === 'unseen'
    //     ).length;
    //     setUnseenCount(unseenNotifications);
    //   }
    // };

    // socket.on('connect', () => console.log('Connected to socket server:', socket.id));
    // socket.on('stockUpdate', handleStockUpdate);
    // socket.on('disconnect', () => console.log('Disconnected from socket server.'));

    // return () => {
    //   socket.off('stockUpdate', handleStockUpdate);
    //   socket.off('connect');
    //   socket.off('disconnect');
    // };
//   }, [userInfo]);

//   useEffect(() => {
//     if (userInfo?.notifications) {
//       const unseenNotifications = userInfo.notifications.filter(
//         (notification) => notification.notification_status === 'unseen'
//       ).length;
//       setUnseenCount(unseenNotifications);
//     }
//   }, [userInfo, successMessage]);

//   useEffect(() => {
//     if (!userInfo) return;
    
    // const currentDate = getCurrentTime();
    
    // const handleStockUpdate = (data: any) => {
    //   dispatch(
        // add_notification({
        //   authId: userInfo._id,
        //   orderId: data.orderId,
        //   delivery_status: data.status,
        //   order_status: data.status,
        //   enNote: `New Order`,
        //   kuNote: `داواکاری نوێ`,
        //   arNote: `طلب الجدید`,
        //   createdAt: currentDate,
        // })
    //   );
    // };

//     const handleOrderStatusUpdate = (data: any) => {
//       if (userInfo.role === 'poster' && data.status === 'on way') {
//         dispatch(
//           add_notification_poster({
//             authId: userInfo._id,
//             orderId: data.orderId,
//             delivery_status: data.status,
//             enNote: `Order Status Update`,
//             kuNote: `داواکاری نوێکرایەوە`,
//             arNote: `تم تجديد الطلب`,
//             createdAt: currentDate,
//           })
//         );
//       }
      
//       if (userInfo.role === 'stockAdmin' && data.status === 'newOrder') {
//         dispatch(
//           add_notification_stock({
//             authId: userInfo._id,
//             orderId: data.orderId,
//             delivery_status: data.status,
//             enNote: `Order Status Update`,
//             kuNote: `داواکاری نوێکرایەوە`,
//             arNote: `تم تجديد الطلب`,
//             createdAt: currentDate,
//           })
//         );
//       }

//       dispatch(
//         add_notification({
//           authId: userInfo._id,
//           orderId: data.orderId,
//           delivery_status: data.status,
//           enNote: `Order Status Update`,
//           kuNote: `داواکاری نوێکرایەوە`,
//           arNote: `تم تجديد الطلب`,
//           createdAt: currentDate,
//         })
//       );
//     };

//     socket.on('stockUpdate', handleStockUpdate);
//     socket.on('orderStatusUpdate', handleOrderStatusUpdate);

//     return () => {
//       socket.off('stockUpdate', handleStockUpdate);
//       socket.off('orderStatusUpdate', handleOrderStatusUpdate);
//     };
//   }, [dispatch, userInfo]);

//   useEffect(() => {
//     const handleAdminPasswordChange = (data: any) => {
//       if (userInfo && userInfo._id === data.userId) {
//         dispatch(logout({ navigate, role }));
//       }
//     };

//     socket.on('adminPasswordChange', handleAdminPasswordChange);
//     return () => {
//       socket.off('adminPasswordChange', handleAdminPasswordChange);
//     };
//   }, [userInfo, dispatch, navigate, role]);

  // useEffect(() => {
  //   if (userInfo?.role) {
  //     dispatch(get_user_info());
  //   }
  // }, [dispatch, userInfo?.role]);

 

//   const handleUpdateNotification = (noteId: string) => {
//     if (userInfo) {
//       dispatch(
//         update_auth_notification({
//           notificationId: noteId,
//           authId: userInfo._id,
//         })
//       );
//     }
//   };

//   useEffect(() => {
//     if (successMessage) {
//       dispatch(get_user_info());
//       dispatch(messageClear());
//     }

//     if (errorMessage) {
//       dispatch(messageClear());
//     }
//   }, [successMessage, errorMessage, dispatch]);

  useEffect(() => {
    document.body.dir = currentLanguage.dir || 'ltr';
    document.title = t('home.app_title');
  }, [currentLanguage, t]);

//   const getNotification = (note: Notification) => {
//     switch (currentLanguage.code) {
//       case 'ar':
//         return note?.arNote;
//       case 'kr':
//         return note?.kuNote;
//       default:
//         return note?.enNote;
//     }
//   };

  return (
    <div className="fixed top-0 left-0 w-full shadow-md z-[999]">
      
      <div
      className={`transition-all duration-300 ease-in-out ${
        currentLanguage.dir === 'ltr'
          ? showSidebar
            ? 'lg:ml-[260px]'
            : 'lg:ml-0'
          : showSidebar
            ? 'lg:mr-[260px]'
            : 'lg:mr-0'
      } ${currentLanguage.dir} h-[65px] flex justify-between items-center bg-[#ffffff] `}
    >
      <div className={`${showSidebar? "px-0":"px-6"}`}>

      <div
        onClick={() => setShowSidebar(!showSidebar)}
        className="w-[35px] flex h-[35px] rounded-sm bg-primary shadow-lg hover:shadow-indigo-500/50 justify-center items-center cursor-pointer text-white"
      >
        <FaList />
      </div>
      </div>

       

        <div className="hidden md:block">
          {/* Search input placeholder */}
        </div>

        <div className="flex justify-center items-center gap-8 relative  px-6">
          <div className="flex justify-center items-center">
            <div className="flex justify-center items-center gap-6">
              {/* <div className="flex justify-center items-center relative top-2">
                <div
                  onClick={() => setCustNote(true)}
                  className="w-[20px] h-[40px] relative cursor-pointer"
                >
                  <div className="relative flex justify-center items-center">
                    <IoIosNotificationsOutline size={30} />
                  </div>
                  <div className="absolute flex justify-center items-center bg-red-500 text-white rounded-full w-[28px] h-[28px] top-0 ltr:right-5 rtl:right-0 translate-x-[50%] -translate-y-[50%]">
                    {unseenCount}
                  </div>
                </div>
              </div> */}

              <div className="flex group cursor-pointer text-slate-800 text-sm justify-center items-center gap-2 relative after:h-[18px] after:w-[1px] after:bg-[#afafaf] after:-right-[16px] after:absolute before:absolute before:h-[18px] before:bg-[#afafaf] before:w-[1px] before:-left-[12px]">
                <img
                  src={currentLanguage.image}
                  className="w-7"
                  alt={currentLanguage.name}
                />
                <IoMdArrowDropdown />
                <ul className="absolute invisible transition-all top-8 rounded-sm duration-200 text-black p-2 w-[100px] flex flex-col gap-3 group-hover:visible group-hover:top-6 group-hover:bg-[#F9FBFE] z-[99999]">
                  {languages.map(({ code, name, country_code, image }) => (
                    <li key={country_code}>
                      <a
                        href="/"
                        className="dropdown-item"
                        onClick={(e) => {
                          e.preventDefault();
                          i18next.changeLanguage(code);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className={
                              code === currentLanguageCode
                                ? 'text-[#2A629A] font-bold'
                                : 'text-black'
                            }
                          >
                            {name}
                          </span>
                          <img
                            src={image}
                            className="w-[22px] h-[15px]"
                            alt={`${name} logo`}
                          />
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-center items-center flex-col text-end">
                <h2 className="text-sm font-bold">{user?.name}</h2>
                <span className="text-[#928d8d] text-[12px] w-full font-normal">
                  {user?.role}
                </span>
              </div>

              {user && (
                <img
                  className="w-[36px] h-[36px] rounded-full overflow-hidden object-cover"
                  src={`${backend_url_img}${user?.image}`}
                  alt="User profile"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* {custNote && (
        <div className="fixed top-19 rtl:left-0 ltr:right-0 w-full bg-[#0000004b] h-screen z-[9999]">
          <div className="fixed pb-16 top-19 py-0 rtl:left-0 ltr:right-0 h-full w-[80%] lg:w-[25%] bg-white flex flex-col overflow-y-auto justify-between shadow-sm">
           {!userInfo?.notifications || userInfo.notifications.length === 0 ? (
              <div className="w-full h-screen flex items-center justify-center">
                <div className="flex w-full justify-end top-16 pt-4 px-0 fixed ltr:right-3 rtl:left-8">
                  <RxCross1
                    size={25}
                    className="cursor-pointer"
                    onClick={() => setCustNote(false)}
                  />
                </div>
                <h5>{t('dashboardS.notification_empty')}</h5>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex bg-primary w-full justify-end items-center p-2 pr-5 px-6">
                    <RxCross1
                      size={25}
                      className="cursor-pointer text-white"
                      onClick={() => setCustNote(false)}
                    />
                  </div>
                  <div className="flex justify-center items-center p-2">
                    <h5 className="text-[20px] font-[500]">
                      {unseenCount} {t('noteS.order_notification')}
                    </h5>
                  </div>
                  <br />
                  <div className="w-full border-t p-2">
                    
                  </div>
                </div>
              </>
            )} 
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Header;