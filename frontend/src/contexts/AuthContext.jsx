import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

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
      const response = await authService.updateProfile(profileData, token);
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