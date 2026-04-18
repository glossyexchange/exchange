import { lazy } from "react";
import type { RouteObject } from 'react-router-dom';

// Lazy-loaded components
// const Login = lazy(() => import('../../views/auth/Login'));
// const Register = lazy(() => import('../../views/auth/Register'));
const AdminLogin = lazy(() => import('../../views/auth/AdminLogin'));
const Home = lazy(() => import('../../views/Home'));
const UnAuthorized = lazy(() => import('@/views/UnAuthorized'));
// const Success = lazy(() => import('../../views/Success'));

// Define public routes with proper typing
const publicRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Home />, 
    },
    // {
    //     path: '/login',
    //     element: <Login />
    // },
    // {
    //     path: '/register',
    //     element: <Register />
    // },
    {
        path: '/login',
        element: <AdminLogin />
    },
    {
        path: '/unauthorized',
        element: <UnAuthorized />
    },
    // {
    //     path: '/success',  // Removed '?' as it's not standard in path definitions
    //     element: <Success />
    // }
];

export default publicRoutes;