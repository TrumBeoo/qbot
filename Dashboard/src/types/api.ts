/**
 * Hinh dang du lieu API cho Dashboard.
 *
 * NGUON SU THAT: api/src/common/wire.ts. Viet tay de khop lai vi Dashboard/
 * khong import duoc tu api/ khi chua co package dung chung.
 *
 * Luu y: Dashboard doc bien VITE_API_URL (co /api o cuoi), khac fe/ doc
 * VITE_API_BASE_URL (khong co).
 */

export interface BusinessInfo {
  business_name?: string;
  business_type?: string;
  industry?: string;
  phone?: string;
  address?: string;
}

export interface AdminUser {
  /** Ke thua tu MongoDB. Bang gia tri voi `id`. */
  _id: string;
  id: string;
  email: string;
  name: string;
  role: string;
  provider: 'email';
  is_active: boolean;
  is_verified: boolean;
  profile_picture: string | null;
  businessInfo: BusinessInfo | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface LoginResponse {
  message: string;
  user: AdminUser;
  token: string;
}

export interface VerifyTokenResponse {
  valid: true;
  user: AdminUser;
  user_type: 'user' | 'admin';
}

/** Nhom /api/dashboard/* boc ket qua trong {status, data}. */
export interface Wrapped<T> {
  status: 'success';
  data: T;
}

export interface DataFile {
  filename: string;
  content?: string;
  file_size?: number;
  line_count?: number;
  word_count?: number;
  last_modified?: string | number;
  status?: string;
}

export interface LocationImage {
  id: number;
  location_id: number;
  image_url: string;
  image_type: 'main' | 'gallery' | 'thumbnail';
  caption: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Location {
  id: number;
  name: string;
  name_en: string | null;
  category: string;
  district: string | null;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  keywords: string | null;
  images?: LocationImage[];
}

export interface ChatbotStats {
  total_conversations?: number;
  total_messages?: number;
  total_users?: number;
  [key: string]: unknown;
}

/**
 * Hinh dang CHUA duoc anh xa.
 *
 * Cac endpoint /dashboard/analytics/*, /dashboard/chatbot-*, /services/*,
 * /users/* chua duoc port sang API TypeScript (pha 04 moi xong nhom auth va
 * hoi thoai). Chua co nguon su that de viet kieu chinh xac, va doan ra thi
 * te hon la noi that.
 *
 * Dung kieu nay tam thoi. Khi port nhom tuong ung o pha 04 thi thay bang
 * kieu that - luc do TypeScript se chi ra dung nhung cho dang doc field
 * khong ton tai.
 */
export type UnmappedResponse = Record<string, any>;

/**
 * Props recharts truyen vao component tooltip tuy chinh.
 *
 * Ca ba deu TUY CHON: recharts chi truyen chung khi con tro dang o tren
 * bieu do. Cac component tooltip trong repo nay da kiem `if (active &&
 * payload && payload.length)` roi - kieu chi ghi lai dieu do.
 */
export interface RechartsTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string | number;
    payload?: Record<string, any>;
  }>;
  label?: string | number;
}
