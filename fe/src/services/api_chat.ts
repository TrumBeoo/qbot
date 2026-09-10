// src/services/api_chat.ts
//
// Chuyen tu api_chat.js (pha 06). Than ham giu nguyen; chi them kieu o
// BIEN GIOI: tham so, gia tri tra ve, va hinh dang JSON tu API.
//
// Kieu o day mo ta hop dong THAT, da doi chieu bang cach goi endpoint:
// POST /voice-chat tra ve {status, response, language, audio} - field ten
// `audio`, khong phai `audio_base64`.

import type { ChatImage, ChatReply, VoiceReply } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5555';

export interface SendMessageResult {
  success: boolean;
  message?: string;
  language?: string;
  images?: ChatImage[];
  conversation_id?: string;
  error?: string;
}

export interface SendVoiceResult {
  success: boolean;
  message?: string;
  language?: string;
  audio?: string;
  error?: string;
}

const FALLBACK_ERROR = 'Không thể kết nối đến server. Vui lòng thử lại sau.';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  async sendMessage(
    message: string,
    language: string | null = null,
    conversationId: string | null = null,
  ): Promise<SendMessageResult> {
    try {
      const isAuth = this.isAuthenticated();
      const endpoint = isAuth ? '/chat-authenticated' : '/chat';

      const requestBody: Record<string, string> = { message };
      if (language) requestBody.language = language;
      if (conversationId && isAuth) requestBody.conversation_id = conversationId;

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: isAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as ChatReply & { message?: string };

      if (data.status === 'success') {
        return {
          success: true,
          message: data.response,
          language: data.language,
          images: data.images || [],
          conversation_id: data.conversation_id,
        };
      }
      throw new Error(data.message || 'Unknown error occurred');
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : FALLBACK_ERROR,
      };
    }
  }

  async sendVoiceMessage(
    text: string,
    language: string | null = null,
    conversationId: string | null = null,
  ): Promise<SendVoiceResult> {
    try {
      const isAuth = this.isAuthenticated();
      const endpoint = isAuth ? '/voice-chat-authenticated' : '/voice-chat';

      const requestBody: Record<string, string> = { text };
      if (language) requestBody.language = language;
      if (conversationId && isAuth) requestBody.conversation_id = conversationId;

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: isAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as VoiceReply & { message?: string };

      if (data.status === 'success') {
        return {
          success: true,
          message: data.response,
          language: data.language,
          // Field ten `audio` (khong phai audio_base64): be/app.py:307 tra
          // MP3 ma base64 duoi ten nay. Endpoint /tts cua AI service o pha
          // 03 dung ten `audio_base64` - HAI endpoint khac nhau, dung lan.
          audio: data.audio,
        };
      }
      throw new Error(data.message || 'Unknown error occurred');
    } catch (error) {
      console.error('Voice API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : FALLBACK_ERROR,
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const data = (await response.json()) as { status?: string };
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
