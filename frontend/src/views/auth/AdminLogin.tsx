import { useAuth } from '@/context/AuthContext';
import { AppDispatch } from '@/store';
import { admin_login, messageClear } from '@/store/Reducers/authReducer';
import { RootState } from '@/store/rootReducers';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PropagateLoader } from 'react-spinners';
import logo from '../../assets/logo.png';


// Define state type
type LoginState = {
  phone: string;
  password: string;
};

const AdminLogin = () => {
  const { t, i18n } = useTranslation();
//  const { login } = useAuth();
  const { isAuthenticated, user } = useAuth();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === 'ar' || currentLanguage === 'kr';
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch(); // Use your AppDispatch type
  
  // Define Redux state types
  const { loader, errorMessage, successMessage } = useSelector(
    (state: RootState) => state.auth
  );

  const [state, setState] = useState<LoginState>({
    phone: '',
    password: '',
  });

  const inputHandle = (e: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     navigate('/', { replace: true });
  //   }
  // }, [isAuthenticated, navigate]);


//  useEffect(() => {
//     const token = localStorage.getItem('accessToken');
//     if (token) {
//       navigate('/', { replace: true });
//     }
//   }, [navigate]);
useEffect(() => {
  if (isAuthenticated && user) {
    switch (user.role) {
      case "admin":
        navigate("/dashboard", { replace: true });
        break;
      case "manager":
        navigate("/dashboard", { replace: true }); 
        break;
      // case "doctor":
      //   navigate("/dashboard/patients", { replace: true });
      //   break;
      // case "lab":
      //   navigate("/dashboard/patient-list", { replace: true }); 
      //   break;
      default:
        navigate("/", { replace: true });
    }
  }
}, [isAuthenticated, user, navigate]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(admin_login(state));
  };

  const overrideStyle = {
    display: 'flex',
    margin: '0 auto',
    height: '24px',
    justifyContent: 'center',
    alignItems: 'center',
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      
      // Get the token from localStorage and update AuthContext
      // const token = localStorage.getItem('accessToken');
      // if (token) {
      //   login(token); // This updates the AuthContext
      // }
      
      // navigate('/', { replace: true });
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [errorMessage, successMessage, dispatch]);

//  useEffect(() => {
//     if (successMessage) {
//       toast.success(successMessage);
//       dispatch(messageClear());
//       navigate('/', { replace: true });
//     }
//     if (errorMessage) {
//       toast.error(errorMessage);
//       dispatch(messageClear());
//     }
//   }, [errorMessage, successMessage, dispatch, navigate]);

// if (authLoading) {
//     return (
//       <div className="min-w-screen min-h-screen bg-[#f5f4f7] flex justify-center items-center">
//         <div>Loading...</div>
//       </div>
//     );
//   }

  return (
    <div className="min-w-screen min-h-screen bg-[#f5f4f7] flex justify-center items-center">
      <div className="w-[350px] text-[#000000] p-2">
        <div className="bg-white p-4 rounded-md">
          <div className="h-[70px] mb-8 pt-6 flex justify-center items-center">
            <div className="w-[160px] h-[70px]">
              <img className="w-full h-full" src={logo} alt="Company Logo" />
            </div>
          </div>
          <div className="mb-6 p-4 flex justify-center border-b-2 items-center">
            <h2 className="text-lg font-medium">
              {t('adminLoginS.admin_login')}
            </h2>
          </div>
          <form onSubmit={submit}>
            <div className="flex flex-col w-full gap-1 mb-3">
              <label
                className={`${isRTL ? 'text-right' : 'text-left'}`}
                htmlFor="phone"
              >
                {t('addShopS.phone')}
              </label>
              <input
                onChange={inputHandle}
                value={state.phone}
                className={`px-3 py-2 outline-none border border-slate-400 bg-transparent rounded-md ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
                type="text"
                name="phone"
                id="phone"
                required
              />
            </div>

            <div className="flex flex-col w-full gap-1 mb-5">
              <label
                className={`${isRTL ? 'text-right' : 'text-left'}`}
                htmlFor="password"
              >
                {t('addShopS.password')}
              </label>
              <input
                onChange={inputHandle}
                value={state.password}
                className={`px-3 py-2 outline-none border border-slate-400 bg-transparent rounded-md ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
                type="password"
                name="password"
                // placeholder={t('addShopS.password_placeholder')}
                id="password"
                required
              />
            </div>

            <button
              disabled={loader}
              className={`bg-primary w-full hover:shadow-blue-300/50 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3 transition-all ${
                loader ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loader ? (
                <PropagateLoader color="#fff" cssOverride={overrideStyle} />
              ) : (
                t('adminLoginS.login')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;