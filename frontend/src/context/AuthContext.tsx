import { RootState } from '@/store/rootReducers';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

interface User {
  role: string;
  id: number;
  name: string;
  phone: string;
  image?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  loadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  const { token: reduxToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('accessToken') || reduxToken;
      
      if (!token) {
        setLoadingAuth(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          localStorage.removeItem('accessToken');
          setLoadingAuth(false);
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        // Set user info from token
        const userData: User = {
          role: decoded.role,
          id: decoded.id,
          name: decoded.name,
          phone: decoded.phone,
          image: decoded.image
        };
        
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('accessToken');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoadingAuth(false);
      }
    };

    verifyToken();
  }, [reduxToken]);

  const login = useCallback((token: string) => {
  localStorage.setItem('accessToken', token);
  const decoded: any = jwtDecode(token);
  
  const userData: User = {
    role: decoded.role,
    id: decoded.id,
    name: decoded.name,
    phone: decoded.phone,
    image: decoded.image
  };
  
  setUser(userData);
  setIsAuthenticated(true);
}, []);


const logout = useCallback(() => {
  localStorage.removeItem('accessToken');
  setIsAuthenticated(false);
  setUser(null);
  navigate('/login');
}, [navigate]);

const contextValue = useMemo(() => ({
  isAuthenticated,
  user,
  login,
  logout,
  loadingAuth
}), [isAuthenticated, user, loadingAuth, login, logout]);

return (
  <AuthContext.Provider value={contextValue}>
    {children}
  </AuthContext.Provider>
);
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};