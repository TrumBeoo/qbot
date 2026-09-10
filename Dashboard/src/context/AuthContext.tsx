// src/context/AuthContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import type { AdminUser } from '../types/api';

/** Ket qua cac ham auth. `error` la thong diep da dich san (tieng Viet). */
export interface AuthActionResult {
  success: boolean;
  error?: string;
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: { email: string; password: string }) => Promise<AuthActionResult>;
  register: (userData: Record<string, unknown>) => Promise<AuthActionResult>;
  googleLogin: (googleToken: string) => Promise<AuthActionResult>;
  facebookLogin: (facebookToken: string) => Promise<AuthActionResult>;
  logout: () => void;
  updateProfile: (profileData: Record<string, unknown>) => Promise<AuthActionResult>;
}

// undefined co y: useAuth() kiem `if (!context)` de bat viec dung hook
// ngoai Provider.
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
    case 'UPDATE_USER':
      // Chi thay user, giu nguyen token va co isAuthenticated: cap nhat
      // profile khong phai dang nhap lai.
      return { ...state, user: action.payload };
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

  // Profile.tsx goi ham nay. Truoc day context khong cung cap nen no
  // undefined va man hinh sua profile crash khi bam Luu.
  const updateProfile = async (
    profileData: Record<string, unknown>,
  ): Promise<AuthActionResult> => {
    try {
      const response = await authAPI.updateProfile(profileData);
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Cập nhật thông tin thất bại';
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
      logout,
      updateProfile
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