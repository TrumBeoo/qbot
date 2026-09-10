// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor để handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  googleLogin: (token) => api.post('/auth/google-login', { token }),
  facebookLogin: (token) => api.post('/auth/facebook-login', { token }),
  verifyToken: (token) => api.post('/auth/verify-token', {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  logout: () => api.post('/auth/logout'),
};

// Chatbot management API
// Dashboard API for real analytics data
export const dashboardAPI = {
  getRealAnalyticsData: () => api.get('/dashboard/real-analytics'),
  getComprehensiveAnalytics: () => api.get('/dashboard/analytics/comprehensive'),
  getUserAnalytics: () => api.get('/dashboard/analytics/user'),
  getConversationInsights: () => api.get('/dashboard/analytics/insights'),
};

export const chatbotAPI = {
  // Get chatbot statistics
  getStats: () => api.get('/dashboard/chatbot-stats'),
  
  // Data source management
  getDataSources: () => api.get('/dashboard/data-sources'),
  addDataSource: (filename, content) => api.post('/dashboard/data-sources', { filename, content }),
  getFileContent: (filename) => api.get(`/dashboard/data-sources/${filename}`),
  updateDataSource: (filename, content) => api.put(`/dashboard/data-sources/${filename}`, { content }),
  deleteDataSource: (filename) => api.delete(`/dashboard/data-sources/${filename}`),
  
  // File upload management
  uploadData: (formData) => {
    return api.post('/dashboard/upload-data', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Document management
  getDocuments: () => api.get('/dashboard/documents'),
  getDocument: (id) => api.get(`/dashboard/documents/${id}`),
  updateDocument: (id, data) => api.put(`/dashboard/documents/${id}`, data),
  deleteDocument: (id) => api.delete(`/dashboard/documents/${id}`),
  
  // Chatbot testing
  testChatbot: (query, language = 'vi') => api.post('/dashboard/chatbot-test', { query, language }),
  
  // Vector store management
  rebuildVectorstore: () => api.post('/dashboard/rebuild-vectorstore'),
};

// Business services API (existing functionality)
export const servicesAPI = {
  getServices: () => api.get('/services'),
  addService: (serviceData) => api.post('/services', serviceData),
  updateService: (id, serviceData) => api.put(`/services/${id}`, serviceData),
  deleteService: (id) => api.delete(`/services/${id}`),
};

// User management API
export const usersAPI = {
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateUserPermissions: (id, permissions) => api.put(`/users/${id}/permissions`, { permissions }),
  getUserPermissions: (id) => api.get(`/users/${id}/permissions`),
};

export { api };
export default api;