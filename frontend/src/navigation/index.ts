// import { allNav } from './allNav';
// import type { NavItem, Role } from './types/navigation';

// // export const getNav = (role: Role): NavItem[] => {
// //   return allNav.filter(item => item.role === role);
// // };

// export const getNav = (role: Role): NavItem[] => {
//   return allNav.filter(item => {
//     if (Array.isArray(item.role)) return item.role.includes(role);
//     return item.role === role;
//   });
// };

import { allNav } from './allNav';
import type { NavItem, Role } from './types/navigation';

export const getNav = (role: Role): NavItem[] => {
  return allNav.filter(item => {
    if (Array.isArray(item.role)) {
      return item.role.includes(role);
    }
    return item.role === role;
  });
};