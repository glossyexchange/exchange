// // src/routes/getRoutes.tsx
// import { ReactElement } from 'react';
// import { RouteObject } from 'react-router-dom';
// import MainLayout from '../../layout/MainLayout';
// import ProtectRoute from './ProtectRoute';
// import { privateRoutes as importedPrivateRoutes } from './privateRoutes';

// interface PrivateRoute extends Omit<RouteObject, "children"> {
//   role?: string;
//   element: ReactElement;
// }

// // Ensure privateRoutes is typed as PrivateRoute[]
// const privateRoutes: PrivateRoute[] = importedPrivateRoutes as PrivateRoute[];

// export const getRoutes = (): RouteObject => {
//   const protectedRoutes: RouteObject[] = privateRoutes.map((r) => ({
//     ...r,
//     element: <ProtectRoute role={r.role}>{r.element}</ProtectRoute>,
//   }));

//   return {
//     path: '/',
//     element: <MainLayout />,
//     children: protectedRoutes,
//   };
// };



import { ReactElement } from 'react';
import { RouteObject } from 'react-router-dom';
import MainLayout from '../../layout/MainLayout';
import ProtectRoute from './ProtectRoute';
import { privateRoutes as importedPrivateRoutes } from './privateRoutes';

interface PrivateRoute {
  path?: string;
  element: ReactElement;
  roles?: string | string[];
  children?: PrivateRoute[];
  index?: boolean;

}

const privateRoutes: PrivateRoute[] = importedPrivateRoutes as PrivateRoute[];

export const getRoutes = (): RouteObject => {
  const convertRoute = (route: PrivateRoute): RouteObject => {
    const { roles, element, children, ...rest } = route;
    
    const routeObject: RouteObject = {
      ...rest,
      element: roles ? <ProtectRoute roles={roles}>{element}</ProtectRoute> : element,
    };

    if (children) {
      routeObject.children = children.map(convertRoute);
    }

    return routeObject;
  };

  const protectedRoutes: RouteObject[] = privateRoutes.map(convertRoute);

  return {
    path: '/',
    element: <MainLayout />,
    children: protectedRoutes,
  };
};