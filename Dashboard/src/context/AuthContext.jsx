// src/context/AuthContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.verifyToken(token);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: response.data.user, token }
          });
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_ERROR', payload: null });
        }
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: null });
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Đăng nhập thất bại';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      // Transform form data to match backend expectations
      const registerData = {
        name: userData.businessName,
        email: userData.email,
        password: userData.password,
        businessInfo: {
          business_name: userData.businessName,
          business_type: userData.businessType,
          industry: 'Tourism',
          phone: userData.phone,
          address: `${userData.address}, ${userData.district}, ${userData.city}`,
          description: userData.description || ''
        }
      };
      
      const response = await authAPI.register(registerData);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Đăng ký thất bại';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, error: message };
    }
  };

  const googleLogin = async (googleToken) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.googleLogin(googleToken);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Đăng nhập Google thất bại';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, error: message };
    }
  };

  const facebookLogin = async (facebookToken) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.facebookLogin(facebookToken);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Đăng nhập Facebook thất bại';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      googleLogin,
      facebookLogin,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};