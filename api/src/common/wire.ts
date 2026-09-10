import type { Admin, User } from '@prisma/client';

/**
 * Chuyen record Postgres thanh hinh dang JSON ma frontend HIEN TAI dang doc.
 *
 * Vi sao khong tra ve hinh dang sach hon: pha 05 phai cat sang API nay chi
 * bang mot dong doi VITE_API_BASE_URL. Neu doi hop dong o day thi
 * fe/ va Dashboard/ vo ngay, va viec cat khong con re nua.
 *
 * Cu the nhung cho co ve la:
 *   - "_id": ke thua tu MongoDB. Frontend doc thang field nay
 *     (vi du be/auth/auth.py duong 250 lam user_dict['_id']).
 *   - tron snake_case (profile_picture, is_active) voi camelCase
 *     (businessInfo). Do la nguyen trang, khong phai loi go.
 *
 * NO KY THUAT: pha 06 (JSX sang TSX) la luc doi hop dong nay sang camelCase
 * dong nhat, vi luc do frontend duoc viet lai va type sinh tu Prisma.
 */

export type WireUser = {
  _id: string;
  id: string;
  email: string;
  name: string;
  provider: string;
  profile_picture: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
  businessInfo: unknown;
  google_id?: string;
  facebook_id?: string;
};

export function toWireUser(u: User): WireUser {
  const out: WireUser = {
    _id: u.id,
    // Ban cu tra ve ca "_id" va "id" o PUT /profile nhung khong tra "id" o
    // cac route khac. Tra ca hai o moi cho cho nhat quan - them field thi
    // khong lam vo client nao.
    id: u.id,
    email: u.email,
    name: u.name,
    provider: u.provider,
    profile_picture: u.profilePicture,
    is_active: u.isActive,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
    last_login: u.lastLoginAt,
    businessInfo: u.businessInfo,
  };
  // Ban cu chi them 2 field nay khi co gia tri, giu dung nhu vay.
  if (u.googleId) out.google_id = u.googleId;
  if (u.facebookId) out.facebook_id = u.facebookId;
  return out;
}

export type WireAdmin = {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: string;
  provider: string;
  is_active: boolean;
  is_verified: boolean;
  profile_picture: string | null;
  businessInfo: unknown;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
};

export function toWireAdmin(a: Admin): WireAdmin {
  return {
    _id: a.id,
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    // Admin trong Postgres khong co cot provider (chi User co). Ban Mongo cu
    // luu "provider": "email" cung cho admin va Dashboard co doc, nen tra
    // hang so cho khoi vo.
    provider: 'email',
    is_active: a.isActive,
    is_verified: a.isVerified,
    profile_picture: a.profilePicture,
    businessInfo: a.businessInfo,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
    last_login: a.lastLoginAt,
  };
}

// ============================================================
// Hoi thoai va tin nhan
// ============================================================

import type { Conversation, Message } from '@prisma/client';

/**
 * CHU Y ten field: ban cu tra ve "timestamp" cho tin nhan
 * (be/models/mysql_models.py duong 20), trong khi cot Postgres la
 * "createdAt". Frontend doc "timestamp" nen phai anh xa nguoc lai.
 * Doi ten nay la viec cua pha 06.
 */
export type WireMessage = {
  id: string;
  conversation_id: string;
  text: string;
  sender: string;
  language: string;
  timestamp: Date;
};

export function toWireMessage(m: Message): WireMessage {
  return {
    id: m.id,
    conversation_id: m.conversationId,
    text: m.text,
    sender: m.sender,
    language: m.language,
    timestamp: m.createdAt,
  };
}

export type WireConversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  message_count: number;
  messages?: WireMessage[];
};

export function toWireConversation(
  c: Conversation & { messages?: Message[]; _count?: { messages: number } },
): WireConversation {
  const out: WireConversation = {
    id: c.id,
    user_id: c.userId,
    title: c.title,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    // Ban cu goi get_message_count(). Uu tien _count cua Prisma (mot truy
    // van dem) roi moi den do dai mang khi da include messages.
    message_count: c._count?.messages ?? c.messages?.length ?? 0,
  };
  if (c.messages) out.messages = c.messages.map(toWireMessage);
  return out;
}
