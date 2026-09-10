import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types/api';

/**
 * Ket qua cua cac ham auth. Ca bon ham (login, register, socialLogin,
 * updateProfile) deu tra ve `{success: true, user}` hoac
 * `{success: false, error}`.
 *
 * Dang dung field TUY CHON thay vi discriminated union, vi
 * `strictNullChecks` dang tat: khong co no, TS khong narrow duoc union nen
 * `if (r.success) ... else r.error` bao loi du code viet dung. Da thu:
 * bat strictNullChecks thi 5 loi narrow con 3, nhung tong loi nhay tu 58
 * len 125 - chua den luc.
 *
 * KHI BAT strictNullChecks: doi thanh union that de TS bat duoc viec doc
 * `user` ma chua kiem `success`.
 *   export type AuthResult =
 *     | { success: true; user: User }
 *     | { success: false; error: string };
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  // Ba tham so roi, khong phai mot object: doc tu chinh dinh nghia o duoi.
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  socialLogin: (provider: string, token: string) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (profileData: unknown) => Promise<AuthResult>;
}

// undefined lam gia tri mac dinh, co y: useAuth() kiem `if (!context)` de
// bat truong hop dung hook ngoai Provider.
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to get user from localStorage on initial load
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is authenticated on app load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const userData = await authService.verifyToken(savedToken);
          setUser(userData);
          setToken(savedToken);
          // Save user data to localStorage for offline access
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Token verification failed:', error);
          
          // Only remove token if it's actually invalid (not network error)
          if (error.message && (
            error.message.includes('Token has expired') ||
            error.message.includes('Token is invalid') ||
            (error.message.includes('Token verification failed') && !error.message.includes('Network error'))
          )) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          } else {
            // For network errors, keep the token and user data
            console.warn('Network error during token verification, keeping existing session');
            setToken(savedToken);
            // Keep existing user data from localStorage if available
            const savedUser = localStorage.getItem('user');
            if (savedUser && !user) {
              setUser(JSON.parse(savedUser));
            }
            
            // Retry token verification after 5 seconds
            setTimeout(async () => {
              try {
                const userData = await authService.verifyToken(savedToken);
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                console.log('Token verification retry successful');
              } catch (retryError) {
                console.warn('Token verification retry failed:', retryError);
              }
            }, 5000);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authService.register(name, email, password);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  };

  const socialLogin = async (provider, token) => {
    try {
      let response;
      if (provider === 'google') {
        response = await authService.googleLogin(token);
      } else if (provider === 'facebook') {
        response = await authService.facebookLogin(token);
      } else {
        throw new Error('Unsupported provider');
      }
      
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      return { success: true, user: response.user };
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      return { 
        success: false, 
        error: error.message || `${provider} login failed` 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear any other user-related data from localStorage
    localStorage.removeItem('currentConversationId');
  };

  const updateProfile = async (profileData) => {
    try {
      // Bo tham so `token` thu hai: authService.updateProfile chi nhan mot
      // tham so va tu doc token qua getAuthHeaders(). Tham so kia bi lang
      // le bo qua.
      const response = await authService.updateProfile(profileData);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Profile update failed:', error);
      return { 
        success: false, 
        error: error.message || 'Profile update failed' 
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    socialLogin,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};