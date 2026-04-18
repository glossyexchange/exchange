import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
import type { RouteObject } from 'react-router-dom';
import Router from './router/Router';
import { getRoutes } from './router/routes';
import publicRoutes from './router/routes/publicRoutes';
// import { get_user_info } from './store/Reducers/authReducer';
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState } from './store/rootReducers';
import { AuthProvider } from './context/AuthContext';
import { SendTransferProvider } from './context/SendTransferContext';

function App() {
  const [allRoutes, setAllRoutes] = useState<RouteObject[]>([...publicRoutes]);

  useEffect(() => {
    const routes = getRoutes();
    setAllRoutes(prev => [...prev, routes]);
  }, []);

  return (
    <AuthProvider>
      <SendTransferProvider>
<Router allRoutes={allRoutes} />
      </SendTransferProvider>
      
    </AuthProvider>
  );
}

export default App;