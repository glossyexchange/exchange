// Home.tsx
import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { Navigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { isAuthenticated, user, loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }


  // Role-based routing
  switch (user?.role) {
    case 'manager':
    case 'editor':
    case 'admin':
    case 'superadmin':
      return <Navigate to="dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default Home;

// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '@/context/AuthContext';

// const Home: React.FC = () => {
//   const { isAuthenticated, user, loading } = useAuth();

//   // Show loading state while authentication is being verified
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   // Handle unauthenticated users
//   if (!isAuthenticated) {
//     return <Navigate to="/admin/login" replace />;
//   }

  

//   // Role-based routing
//   switch (user?.role) {
//     case 'manager':
//     case 'editor':
//     case 'admin':
//     case 'superadmin':
//       return <Navigate to="/admin/dashboard" replace />;
//     default:
//       return <Navigate to="/admin/login" replace />;
//   }
// };

// export default Home;