// import type { RouteObject } from 'react-router-dom'

// import { adminRoutes } from './adminRoutes'
// // import { posterRoutes } from './posterRoutes'
// // import { storageRoutes } from './storageRoutes'
// // import { adminOrdersRoutes } from './adminOrdersRoutes'
// // import { userRoutes } from './userRoutes';

// export const privateRoutes: RouteObject[] = [
//   ...adminRoutes,
// //   ...storageRoutes,
// //   ...posterRoutes,
// //   ...adminOrdersRoutes,
// ]

import type { PrivateRoute } from '../../navigation/types/routes';
import { adminRoutes } from './adminRoutes';
// import { doctorRoutes } from './doctorRoutes';
import { managerRoutes } from './managerRoutes';
// import { receptionRoutes } from './receptionRoutes';

const mergeRoutesByPath = (routes: PrivateRoute[]): PrivateRoute[] => {
  const routeMap = new Map<string, PrivateRoute>();
  
  routes.forEach(route => {
    if (route.path && routeMap.has(route.path)) {
      // Merge roles for existing path
      const existingRoute = routeMap.get(route.path)!;
      
      // Convert existing roles to array
      const existingRoles = Array.isArray(existingRoute.roles) 
        ? existingRoute.roles 
        : existingRoute.roles ? [existingRoute.roles] : [];
      
      // Convert new roles to array
      const newRoles = Array.isArray(route.roles) 
        ? route.roles 
        : route.roles ? [route.roles] : [];
      
      // Merge and deduplicate
      const mergedRoles = [...new Set([...existingRoles, ...newRoles])];
      
      routeMap.set(route.path, {
        ...existingRoute,
        roles: mergedRoles.length === 1 ? mergedRoles[0] : mergedRoles
      });
    } else {
      routeMap.set(route.path!, route);
    }
  });
  
  return Array.from(routeMap.values());
};

export const privateRoutes: PrivateRoute[] = mergeRoutesByPath([
  ...adminRoutes,
  // ...receptionRoutes,
  // ...doctorRoutes,
  ...managerRoutes,
]);
