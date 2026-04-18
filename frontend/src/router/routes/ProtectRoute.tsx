import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectRouteProps {
  roles?: string | string[]; 
  children: React.ReactNode;
}

const ProtectRoute: React.FC<ProtectRouteProps> = ({ roles, children }) => {
  const { isAuthenticated, user, loadingAuth } = useAuth();


  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

 
  

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

 
  const hasRequiredRole = (): boolean => {
    if (!roles) return true; 
    
    const userRole = user?.role;
    if (!userRole) return false;
    

    if (typeof roles === 'string') {
      return userRole === roles;
    }
    
 
    return Array.isArray(roles) && roles.includes(userRole);
  };

  if (roles && !hasRequiredRole()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectRoute;