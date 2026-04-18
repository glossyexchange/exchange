import { ReactElement } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Role } from './navigation'; // Import your Role type

export interface PrivateRoute extends Omit<RouteObject, 'children'> {
  roles?: Role | Role[];
  element: React.ReactNode;
  children?: PrivateRoute[];
}

// Update your receptionRoutes type
export type ReceptionRoute = RouteObject & {
  roles: Role | Role[]; // Changed from single role to allow array
};



// Type for our internal route configuration
export interface AppRoute {
  path?: string;
  element: ReactElement;
  roles?: Role | Role[];
  children?: AppRoute[];
  // Add other RouteObject properties as needed
  index?: boolean;
  caseSensitive?: boolean;
  id?: string;
}

// Type guard to check if a route has roles
export const hasRoles = (route: any): route is AppRoute & { roles: Role | Role[] } => {
  return route.roles !== undefined;
};