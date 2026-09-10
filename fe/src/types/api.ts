/**
 * Hinh dang du lieu API tra ve.
 *
 * NGUON SU THAT: api/src/common/wire.ts. File nay viet tay de khop lai -
 * fe/ khong the import tu api/ khi chua co package dung chung.
 * Doi hinh dang o wire.ts thi phai doi ca o day.
 *
 * Nhieu ten field trong nay trong la (user._id, profile_picture canh
 * businessInfo, message.timestamp thay vi createdAt). Do khong phai loi go:
 * hop dong duoc giu y nguyen ban Flask de pha 05 cat duoc bang mot dong doi
 * bien moi truong. Doi ten la viec sau khi Flask bien mat.
 */

// ============================================================
// Tai khoan
// ============================================================

export type AuthProvider = 'email' | 'google' | 'facebook';

export interface BusinessInfo {
  business_name?: string;
  business_type?: string;
  industry?: string;
  phone?: string;
  address?: string;
}

export interface User {
  /** Ke thua tu MongoDB. Bang gia tri voi `id`. */
  _id: string;
  id: string;
  email: string;
  name: string;
  provider: AuthProvider;
  profile_picture: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  businessInfo: BusinessInfo | null;
  google_id?: string;
  facebook_id?: string;
}

export interface Admin extends Omit<User, 'businessInfo' | 'provider'> {
  role: string;
  provider: 'email';
  is_verified: boolean;
  businessInfo: BusinessInfo | null;
}

export interface AuthPayload {
  message: string;
  user: User | Admin;
  token: string;
}

export interface VerifyTokenPayload {
  valid: true;
  user: User | Admin;
  user_type: 'user' | 'admin';
}

// ============================================================
// Hoi thoai
// ============================================================

export type MessageSender = 'user' | 'bot';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  text: string;
  sender: MessageSender;
  language: string;
  /** Ban cu dat ten la "timestamp", khong phai created_at. */
  timestamp: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  /** Chi co khi doc mot hoi thoai cu the hoac khi export. */
  messages?: ChatMessage[];
}

export interface ConversationStats {
  total_conversations: number;
  total_messages: number;
  user_messages: number;
  bot_messages: number;
}

export interface ConversationSummary {
  summary: string;
  topics: string[];
}

// ============================================================
// Chat va giong noi
// ============================================================

export interface ChatImage {
  url: string;
  caption?: string;
  location?: string;
}

export interface ChatReply {
  status: 'success' | 'error';
  response: string;
  language: string;
  images: ChatImage[];
  conversation_id?: string;
}

export interface VoiceReply extends ChatReply {
  /**
   * MP3 ma base64. Ten field la `audio` - da doi chieu bang cach goi
   * POST /voice-chat tren be/ (be/app.py:307).
   *
   * Dung nham voi /tts cua AI service, endpoint do tra `audio_base64`.
   */
  audio?: string;
  transcript?: string;
}

// ============================================================
// Hinh dang bao boc
// ============================================================

/**
 * Nhom /api/chat va /api/mysql-chat boc ket qua trong {status, data}.
 * Nhom /api/auth thi tra thang, khong boc. Su khong nhat quan nay la cua
 * ban Flask, giu lai co y.
 */
export interface Wrapped<T> {
  status: 'success';
  data: T;
}

/**
 * Loi. API tra ca ba field cung luc vi hai nhom endpoint cu doc hai field
 * khac nhau: /api/auth doc `error`, /api/chat doc `message`.
 */
export interface ApiError {
  error: string;
  status: 'error';
  message: string;
}

/** Ket qua cac service tra ve cho component. */
export type Result<T> =
  | ({ success: true } & T)
  | { success: false; error: string };

// ============================================================
// Menu dich vu (fe/src/constants/serviceData.ts)
// ============================================================

export interface ServiceCategoryGroup {
  name: string;
  items: string[];
}

/**
 * Mot dich vu trong menu.
 *
 * ServiceToolbar xu ly HAI shape khac nhau qua co `isDetailed`:
 *   - shape don gian: label + description + suggestions
 *     (serviceUtils.ts:84 kiem cac field ['icon','label','color','category'])
 *   - shape chi tiet: title + categories (DETAILED_SERVICE_DATA)
 *
 * Ca hai deu co `icon` va `color`. Cho nen dung superset voi field tuy chon
 * thay vi union: `strictNullChecks` dang tat nen TS khong narrow union
 * duoc. Khi bat strictNullChecks thi tach thanh hai interface roi union
 * lai, TS se bat duoc viec doc `categories` tren shape don gian.
 */
export interface ServiceDefinition {
  /** Ten icon dang chuoi, tra cuu qua iconMap trong ServiceToolbar. */
  icon: string;
  color: string;

  // Shape don gian
  label?: string;
  description?: string;
  suggestions?: string[];
  category?: string;

  // Shape chi tiet (DETAILED_SERVICE_DATA)
  title?: string;
  categories?: ServiceCategoryGroup[];
}

/** Cac dich vu nhom theo category: { navigation: {...}, tourism: {...} }. */
export type ServicesByCategory = Record<string, Record<string, ServiceDefinition>>;

/**
 * Ket qua cac ham auth truyen qua props component.
 * Cung hinh dang voi AuthResult trong contexts/AuthContext.
 */
export interface AuthOutcome {
  success: boolean;
  error?: string;
  user?: unknown;
}
