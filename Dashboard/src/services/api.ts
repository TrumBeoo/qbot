// src/services/api.ts
//
// Chuyen tu api.js (pha 06). Than ham giu nguyen, chi them kieu.
//
// Gia tri that cua viec them kieu o day: moi ham duoi day tra ve
// AxiosResponse<T>, nen component doc `res.data.xxx` duoc kiem tra thay vi
// doan. Truoc day khong co gi ngan viec doc mot field khong ton tai.

import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type {
  AdminUser,
  ChatbotStats,
  UnmappedResponse,
  Wrapped,
  DataFile,
  Location,
  LoginResponse,
  VerifyTokenResponse,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor để handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    // 401 = token het han hoac bi thu hoi -> ve trang dang nhap.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  businessInfo?: Record<string, unknown>;
}

export const authAPI = {
  login: (credentials: LoginCredentials): Promise<AxiosResponse<LoginResponse>> =>
    api.post('/auth/login', credentials),
  register: (userData: RegisterPayload): Promise<AxiosResponse<LoginResponse>> =>
    api.post('/auth/register', userData),
  googleLogin: (token: string): Promise<AxiosResponse<LoginResponse>> =>
    api.post('/auth/google-login', { token }),
  facebookLogin: (token: string): Promise<AxiosResponse<LoginResponse>> =>
    api.post('/auth/facebook-login', { token }),
  verifyToken: (token: string): Promise<AxiosResponse<VerifyTokenResponse>> =>
    api.post('/auth/verify-token', {}, { headers: { Authorization: `Bearer ${token}` } }),
  logout: (): Promise<AxiosResponse<{ message: string }>> => api.post('/auth/logout'),
  // Backend co PUT /api/auth/profile (be/auth/auth.py:232, va nhom auth cua
  // API TypeScript o pha 04). Thieu ham nay nen Profile.tsx goi
  // updateProfile() undefined va crash.
  updateProfile: (
    profileData: Record<string, unknown>,
  ): Promise<AxiosResponse<{ message: string; user: AdminUser }>> =>
    api.put('/auth/profile', profileData),
};

// Dashboard API for real analytics data
export const dashboardAPI = {
  // CHU Y: /dashboard/real-analytics tra 404 tren backend hien tai - khong
  // co endpoint nao ten nhu vay trong be/app.py. Man hinh dung ham nay dang
  // vo. Giu lai de khong doi hanh vi trong pha 06; can quyet dinh xoa man
  // hinh hay viet endpoint.
  getRealAnalyticsData: (): Promise<AxiosResponse<UnmappedResponse>> =>
    api.get('/dashboard/real-analytics'),
  getComprehensiveAnalytics: (): Promise<AxiosResponse<UnmappedResponse>> =>
    api.get('/dashboard/analytics/comprehensive'),
  getUserAnalytics: (): Promise<AxiosResponse<UnmappedResponse>> => api.get('/dashboard/analytics/user'),
  getConversationInsights: (): Promise<AxiosResponse<UnmappedResponse>> =>
    api.get('/dashboard/analytics/insights'),
};

export const chatbotAPI = {
  getStats: (): Promise<AxiosResponse<ChatbotStats>> => api.get('/dashboard/chatbot-stats'),

  // Data source management
  // Wrapped: backend boc trong {status, data} - code goi doc
  // `response.data.data`, khong phai `response.data` tran.
  getDataSources: (): Promise<AxiosResponse<Wrapped<DataFile[]>>> =>
    api.get('/dashboard/data-sources'),
  addDataSource: (filename: string, content: string): Promise<AxiosResponse<UnmappedResponse>> =>
    api.post('/dashboard/data-sources', { filename, content }),
  // Wrapped: code goi doc `response.data.data.content`.
  getFileContent: (filename: string): Promise<AxiosResponse<Wrapped<DataFile>>> =>
    api.get(`/dashboard/data-sources/${filename}`),
  updateDataSource: (filename: string, content: string): Promise<AxiosResponse<UnmappedResponse>> =>
    api.put(`/dashboard/data-sources/${filename}`, { content }),
  deleteDataSource: (filename: string): Promise<AxiosResponse<UnmappedResponse>> =>
    api.delete(`/dashboard/data-sources/${filename}`),

  // File upload management
  uploadData: (formData: FormData): Promise<AxiosResponse<UnmappedResponse>> =>
    api.post('/dashboard/upload-data', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // CHU Y: bon ham /dashboard/documents* cung tra 404 tren backend hien tai.
  getDocuments: (): Promise<AxiosResponse<UnmappedResponse>> => api.get('/dashboard/documents'),
  getDocument: (id: string): Promise<AxiosResponse<UnmappedResponse>> =>
    api.get(`/dashboard/documents/${id}`),
  updateDocument: (id: string, data: unknown): Promise<AxiosResponse<UnmappedResponse>> =>
    api.put(`/dashboard/documents/${id}`, data),
  deleteDocument: (id: string): Promise<AxiosResponse<UnmappedResponse>> =>
    api.delete(`/dashboard/documents/${id}`),

  // Chatbot testing
  testChatbot: (query: string, language = 'vi'): Promise<AxiosResponse<UnmappedResponse>> =>
    api.post('/dashboard/chatbot-test', { query, language }),

  // Vector store management
  rebuildVectorstore: (): Promise<AxiosResponse<UnmappedResponse>> =>
    api.post('/dashboard/rebuild-vectorstore'),
};

// Business services API (existing functionality)
export const servicesAPI = {
  getServices: (): Promise<AxiosResponse<UnmappedResponse>> => api.get('/services'),
  addService: (serviceData: unknown): Promise<AxiosResponse<UnmappedResponse>> =>
    api.post('/services', serviceData),
  updateService: (id: string, serviceData: unknown): Promise<AxiosResponse<UnmappedResponse>> =>
    api.put(`/services/${id}`, serviceData),
  deleteService: (id: string): Promise<AxiosResponse<UnmappedResponse>> => api.delete(`/services/${id}`),
};

// User management API
export const usersAPI = {
  getUsers: (): Promise<AxiosResponse<UnmappedResponse>> => api.get('/users'),
  createUser: (userData: unknown): Promise<AxiosResponse<UnmappedResponse>> => api.post('/users', userData),
  updateUser: (id: string, userData: unknown): Promise<AxiosResponse<UnmappedResponse>> =>
    api.put(`/users/${id}`, userData),
  deleteUser: (id: string): Promise<AxiosResponse<UnmappedResponse>> => api.delete(`/users/${id}`),
  updateUserPermissions: (
    id: string,
    permissions: Record<string, unknown>,
  ): Promise<AxiosResponse<UnmappedResponse>> => api.put(`/users/${id}/permissions`, { permissions }),
  getUserPermissions: (id: string): Promise<AxiosResponse<UnmappedResponse>> =>
    api.get(`/users/${id}/permissions`),
};

export type { Location };
export { api };
export default api;
