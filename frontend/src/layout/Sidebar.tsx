

// import React, { useMemo, useState } from "react";
// import { BiLogOutCircle } from "react-icons/bi";
// import { useSelector } from "react-redux";
// import { Link, useLocation } from "react-router-dom";
// import { getNav } from "../navigation/index";

// import { useAuth } from "@/context/AuthContext";
// import { Role } from "@/navigation/types/navigation";
// import cookies from "js-cookie";
// import { useTranslation } from "react-i18next";
// import { FaChevronLeft } from "react-icons/fa";
// import logo from "../assets/wlogo.png";

// // Define Language type
// type Language = {
//   code: string;
//   name: string;
//   dir: "ltr" | "rtl";
//   country_code: string;
//   image: string;
// };

// const languages: Language[] = [
//   {
//     code: "en",
//     name: "English",
//     dir: "ltr",
//     country_code: "en",
//     image: "../../../images/language.png",
//   },
//   {
//     code: "kr",
//     name: "کوردی",
//     dir: "rtl",
//     country_code: "kr",
//     image: "../../../images/kur.png",
//   },
//   {
//     code: "ar",
//     name: "عربي",
//     dir: "rtl",
//     country_code: "ar",
//     image: "../../../images/kur.png",
//   },
// ];

// // Define RootState types
// type AuthState = {
//   role: string;
// };

// type DashboardState = {
//   requestUser: number;
// };

// type RootState = {
//   auth: AuthState;
//   dashboard: DashboardState;
// };

// type SidebarProps = {
//   showSidebar: boolean;
//   setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
// };

// const Sidebar: React.FC<SidebarProps> = ({ showSidebar, setShowSidebar }) => {
//   const currentLanguageCode = cookies.get("i18next") || "en";
//   const currentLanguage = languages.find((l) => l.code === currentLanguageCode);
//   const { t } = useTranslation();
//   const { role } = useSelector((state: RootState) => state.auth);
//   const { logout } = useAuth();

//   const { pathname } = useLocation();
//   const [openSubNav, setOpenSubNav] = useState<string | null>(null);

//   // Helper function to check if a menu item is active
//   const isMenuActive = (item: any) => {
//     if (item.subNav) {
//       return item.subNav.some((sub: any) => sub.path === pathname);
//     }
//     return pathname === item.path;
//   };

//   const allNav = useMemo(() => {
//     return role ? getNav(role as Role) : [];
//   }, [role]);

//   // Auto-expand the menu if the current path is inside a subNav
//   React.useEffect(() => {
//     const activeNav = allNav.find((nav) => isMenuActive(nav));
//     if (activeNav && activeNav.subNav) {
//       setOpenSubNav(String(activeNav.id));
//     }
//   }, [pathname, allNav]);

//   const toggleSubNav = (id: number) => {
//     setOpenSubNav(openSubNav === String(id) ? null : String(id));
//   };

//   // Close sidebar when clicking outside (on mobile only to avoid closing on desktop)
//   const handleOverlayClick = () => {
//     setShowSidebar(false);
//   };

//   return (
//     <div>
//       {/* Overlay - Shows when sidebar is open */}
//       <div
//         onClick={handleOverlayClick}
//         className={`fixed duration-200 
//           ${
//           !showSidebar ? "invisible opacity-0" : "invisible opacity-0"
//         }
//          left-0 top-0 z-[998] h-screen w-screen bg-[#8cbce780]`}
//       ></div>

//       {/* Sidebar Container */}
//       <div
//         className={`fixed top-0 z-[999] h-screen w-[250px] bg-primary shadow-[0_0_15px_0_rgb(34_41_47_/_5%)] transition-all duration-300 ease-in-out
//           ${
//             showSidebar
//               ? currentLanguage?.dir === "ltr"
//                 ? "left-0"
//                 : "right-0"
//               : currentLanguage?.dir === "ltr"
//               ? "-left-[260px]"
//               : "-right-[260px]"
//           } 
//         `}
//       >
//         {/* Logo Header */}
//         <div className="flex h-[60px] items-center justify-center bg-primary">
//           <img className="mt-1 h-auto w-[115px] p-1" src={logo} alt="Logo" />
//         </div>
//         <div className="border-b-1 mt-1 flex items-center justify-center border"></div>

//         <div className="flex h-[calc(100vh-64px)] flex-col">
//           <ul className="scrollbar-thumb-rounded-md flex-1 overflow-y-auto scrollbar-thin scrollbar-track-primary scrollbar-thumb-primary hover:scrollbar-thumb-white">
//             <div className="mt-2 flex h-full flex-col justify-between">
//               <ul className="max-h-full">
//                 {allNav.length > 0 ? (
//                   allNav.map((n) => {
//                     const isActive = isMenuActive(n);
//                     const isOpen = openSubNav === String(n.id);

//                     return (
//                       <li key={n.id} className="relative">
//                         {n.subNav ? (
//                           <button
//                             className={`${
//                               isActive || isOpen
//                                 ? "bg-secondary text-md text-primary shadow-indigo-500/50 duration-500"
//                                 : "font-semiBold text-sm text-white duration-200"
//                             } mb-1 flex w-full items-center justify-start gap-[12px] rounded-sm px-[18px] py-[9px] transition-all hover:pl-2`}
//                             onClick={() => toggleSubNav(n.id)}
//                           >
//                             <span>
//                               {typeof n.icon === "function"
//                                 ? React.createElement(n.icon, {
//                                     style: {
//                                       fontSize: "22px",
//                                       width: "22px",
//                                       height: "22px",
//                                     },
//                                   })
//                                 : React.isValidElement(n.icon)
//                                 ? React.cloneElement(n.icon, {})
//                                 : n.icon}
//                             </span>
//                             <span className="relative">
//                               {t(`dashboard.${n.title}`)}
//                             </span>
//                             <span className="mx-auto flex items-center px-14">
//                               <FaChevronLeft
//                                 className={`transform duration-200 ${
//                                   isOpen
//                                     ? "rotate-90 text-primary"
//                                     : "-rotate-90 text-white"
//                                 }`}
//                               />
//                             </span>
//                           </button>
//                         ) : (
//                           <Link
//                             to={n.path}
//                             onClick={() => {
//                               setOpenSubNav(null);
//                             }}
//                             className={`${
//                               isActive
//                                 ? "bg-secondary text-primary shadow-indigo-500/50 duration-500"
//                                 : "font-semiBold text-sm text-white duration-200"
//                             } mb-1 flex w-full items-center justify-start gap-[8px] border-b-1 rounded-sm px-[18px] py-[9px] transition-all hover:pl-2`}
//                           >
//                             <span>
//                               {typeof n.icon === "function"
//                                 ? React.createElement(n.icon, {
//                                     style: {
//                                       fontSize: "22px",
//                                       width: "22px",
//                                       height: "22px",
//                                     },
//                                   })
//                                 : React.isValidElement(n.icon)
//                                 ? React.cloneElement(n.icon, {})
//                                 : n.icon}
//                             </span>
//                             <span className="relative">
//                               {t(`dashboard.${n.title}`)}
//                             </span>
//                           </Link>
//                         )}

//                         {n.subNav && isOpen && (
//                           <ul className="z-[9999] mt-1 w-full py-[1px] bg-lightPrimary border-b">
//                             {n.subNav.map((subItem) => (
//                               <li key={subItem.id}>
//                                 <Link
//                                   to={subItem.path ?? "/"}
//                                   className={`${
//                                     pathname === subItem.path
//                                       ? "bg-secondary text-sm text-black duration-500"
//                                       : "font-base text-sm text-white duration-200"
//                                   } mb-1 flex w-full items-center justify-start gap-[10px] rounded-sm px-[20px] py-[8px] transition-all`}
//                                 >
//                                   <span>
//                                     {typeof subItem.icon === "function"
//                                       ? React.createElement(subItem.icon, {
//                                           style: {
//                                             fontSize: "14px",
//                                             width: "14px",
//                                             height: "14px",
//                                           },
//                                         })
//                                       : React.isValidElement(subItem.icon)
//                                       ? React.cloneElement(subItem.icon, {})
//                                       : subItem.icon}
//                                   </span>
//                                   <span>{t(`dashboard.${subItem.title}`)}</span>
//                                 </Link>
//                               </li>
//                             ))}
//                           </ul>
//                         )}
//                       </li>
//                     );
//                   })
//                 ) : (
//                   <li className="py-4 text-center text-white">
//                     {t("dashboard.noNavigation")}
//                   </li>
//                 )}

//                 <li className="pb-4">
//                   <button
//                     onClick={logout}
//                     className="font-semiBold flex w-full items-center justify-start gap-[4px] rounded-sm px-[12px] py-[6px] text-sm text-[#030811] transition-all duration-200 hover:pl-4"
//                   >
//                     <span className="text-white">
//                       <BiLogOutCircle size={24} />
//                     </span>
//                     <span className="text-white">{t("dashboard.logout")}</span>
//                   </button>
//                 </li>
//               </ul>
//             </div>
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

import React, { useMemo, useState } from "react";
import { BiLogOutCircle } from "react-icons/bi";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { getNav } from "../navigation/index";

import { useAuth } from "@/context/AuthContext";
import { Role } from "@/navigation/types/navigation";
import cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { FaChevronLeft } from "react-icons/fa";
import logo from "../assets/wlogo.png";

// Define Language type
type Language = {
  code: string;
  name: string;
  dir: "ltr" | "rtl";
  country_code: string;
  image: string;
};

const languages: Language[] = [
  {
    code: "en",
    name: "English",
    dir: "ltr",
    country_code: "en",
    image: "../../../images/language.png",
  },
  {
    code: "kr",
    name: "کوردی",
    dir: "rtl",
    country_code: "kr",
    image: "../../../images/kur.png",
  },
  {
    code: "ar",
    name: "عربي",
    dir: "rtl",
    country_code: "ar",
    image: "../../../images/kur.png",
  },
];

// Define RootState types
type AuthState = {
  role: string;
};

type DashboardState = {
  requestUser: number;
};

type RootState = {
  auth: AuthState;
  dashboard: DashboardState;
};

type SidebarProps = {
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
};

const Sidebar: React.FC<SidebarProps> = ({ showSidebar, setShowSidebar }) => {
  const currentLanguageCode = cookies.get("i18next") || "en";
  const currentLanguage = languages.find((l) => l.code === currentLanguageCode);
  const { t } = useTranslation();
  const { role } = useSelector((state: RootState) => state.auth);
  const { logout } = useAuth();

  const { pathname } = useLocation();
  const [openSubNav, setOpenSubNav] = useState<string | null>(null);

  // Helper function to check if a menu item is active
  const isMenuActive = (item: any) => {
    if (item.subNav) {
      return item.subNav.some((sub: any) => sub.path === pathname);
    }
    return pathname === item.path;
  };

  const allNav = useMemo(() => {
    return role ? getNav(role as Role) : [];
  }, [role]);

  // Auto-expand the menu if the current path is inside a subNav
  React.useEffect(() => {
    const activeNav = allNav.find((nav) => isMenuActive(nav));
    if (activeNav && activeNav.subNav) {
      setOpenSubNav(String(activeNav.id));
    }
  }, [pathname, allNav]);

  const toggleSubNav = (id: number) => {
    setOpenSubNav(openSubNav === String(id) ? null : String(id));
  };

  // Helper function to close sidebar on mobile
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };

  // Close sidebar when clicking outside
  const handleOverlayClick = () => {
    setShowSidebar(false);
  };

  return (
    <div>
      {/* Overlay - Shows when sidebar is open */}
      {/* <div
        onClick={handleOverlayClick}
        className={`fixed duration-200 ${
          !showSidebar ? "invisible opacity-0" : "visible opacity-100"
        } left-0 top-0 z-[998] h-screen w-screen bg-[#8cbce780]`}
      ></div> */}
      <div
  onClick={handleOverlayClick}
  className={`fixed duration-200 ${
    !showSidebar ? "invisible opacity-0" : "visible opacity-100"
  } left-0 top-0 z-[998] h-screen w-screen bg-[#8cbce780] lg:hidden`}
></div>

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 z-[999] h-screen w-[250px] bg-primary shadow-[0_0_15px_0_rgb(34_41_47_/_5%)] transition-all duration-300 ease-in-out
          ${
            showSidebar
              ? currentLanguage?.dir === "ltr"
                ? "left-0"
                : "right-0"
              : currentLanguage?.dir === "ltr"
              ? "-left-[260px]"
              : "-right-[260px]"
          } 
        `}
      >
        {/* Logo Header */}
        <div className="flex h-[60px] items-center justify-center bg-primary">
          <img className="mt-1 h-auto w-[115px] p-1" src={logo} alt="Logo" />
        </div>
        <div className="border-b-1 mt-1 flex items-center justify-center border"></div>

        <div className="flex h-[calc(100vh-64px)] flex-col">
          <ul className="scrollbar-thumb-rounded-md flex-1 overflow-y-auto scrollbar-thin scrollbar-track-primary scrollbar-thumb-primary hover:scrollbar-thumb-white">
            <div className="mt-2 flex h-full flex-col justify-between">
              <ul className="max-h-full">
                {allNav.length > 0 ? (
                  allNav.map((n) => {
                    const isActive = isMenuActive(n);
                    const isOpen = openSubNav === String(n.id);

                    return (
                      <li key={n.id} className="relative">
                        {n.subNav ? (
                          <button
                            className={`${
                              isActive || isOpen
                                ? "bg-secondary text-md text-primary shadow-indigo-500/50 duration-500"
                                : "font-semiBold text-sm text-white duration-200"
                            } mb-1 flex w-full items-center justify-start gap-[4px] rounded-sm px-[18px] py-[9px] transition-all`}
                            onClick={() => toggleSubNav(n.id)}
                          >
                            <span>
                              {typeof n.icon === "function"
                                ? React.createElement(n.icon, {
                                    style: {
                                      fontSize: "22px",
                                      width: "22px",
                                      height: "22px",
                                    },
                                  })
                                : React.isValidElement(n.icon)
                                ? React.cloneElement(n.icon, {})
                                : n.icon}
                            </span>
                            <span className="relative">
                              {t(`dashboard.${n.title}`)}
                            </span>
                            <span className="mx-auto flex items-center px-8">
                              <FaChevronLeft
                                className={`transform duration-200 ${
                                  isOpen
                                    ? "rotate-90 text-primary"
                                    : "-rotate-90 text-white"
                                }`}
                              />
                            </span>
                          </button>
                        ) : (
                          <Link
                            to={n.path}
                            onClick={() => {
                              setOpenSubNav(null);
                              closeSidebarOnMobile(); // Close sidebar on mobile
                            }}
                            className={`${
                              isActive
                                ? "bg-secondary text-primary shadow-indigo-500/50 duration-500"
                                : "font-semiBold text-sm text-white duration-200"
                            } mb-1 flex w-full items-center justify-start gap-[8px] border-b-1 rounded-sm px-[18px] py-[9px] transition-all hover:pl-1`}
                          >
                            <span>
                              {typeof n.icon === "function"
                                ? React.createElement(n.icon, {
                                    style: {
                                      fontSize: "22px",
                                      width: "22px",
                                      height: "22px",
                                    },
                                  })
                                : React.isValidElement(n.icon)
                                ? React.cloneElement(n.icon, {})
                                : n.icon}
                            </span>
                            <span className="relative">
                              {t(`dashboard.${n.title}`)}
                            </span>
                          </Link>
                        )}

                        {n.subNav && isOpen && (
                          <ul className="z-[9999] mt-1 w-full  py-[1px] bg-lightBlue border-b">
                            {n.subNav.map((subItem) => (
                              <li key={subItem.id}>
                                <Link
                                  to={subItem.path ?? "/"}
                                  className={`${
                                    pathname === subItem.path
                                      ? "bg-secondary text-sm text-black duration-500"
                                      : "font-base text-sm text-primary duration-200"
                                 } mb-1 flex w-full items-center justify-start gap-[6px] border-b-1 rounded-sm px-[12px] py-[6px] transition-all`}
                                  onClick={closeSidebarOnMobile} // Close sidebar on mobile
                                >
                                  <span>
                                    {typeof subItem.icon === "function"
                                      ? React.createElement(subItem.icon, {
                                          style: {
                                            fontSize: "14px",
                                            width: "14px",
                                            height: "14px",
                                          },
                                        })
                                      : React.isValidElement(subItem.icon)
                                      ? React.cloneElement(subItem.icon, {})
                                      : subItem.icon}
                                  </span>
                                  <span>{t(`dashboard.${subItem.title}`)}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })
                ) : (
                  <li className="py-4 text-center text-white">
                    {t("dashboard.noNavigation")}
                  </li>
                )}

                <li className="pb-4">
                  <button
                    onClick={logout}
                    className="font-semiBold flex w-full items-center justify-start gap-[4px] rounded-sm px-[12px] py-[6px] text-sm text-[#030811] transition-all duration-200 hover:pl-4"
                  >
                    <span className="text-white">
                      <BiLogOutCircle size={24} />
                    </span>
                    <span className="text-white">{t("dashboard.logout")}</span>
                  </button>
                </li>
              </ul>
            </div>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
