// src/services/api_chat.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5555';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authorization headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  async sendMessage(message, language = null, conversationId = null) {
    try {
      const isAuth = this.isAuthenticated();
      const endpoint = isAuth ? '/chat-authenticated' : '/chat';
      
      const requestBody = { message };
      if (language) requestBody.language = language;
      if (conversationId && isAuth) requestBody.conversation_id = conversationId;

      console.log(`🚀 Sending message to ${endpoint}:`, { 
        message: message.substring(0, 50) + '...', 
        language, 
        conversationId,
        isAuth 
      });

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: isAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        console.log('🖼️ API Response images:', data.images?.length || 0, data.images);
        return {
          success: true,
          message: data.response,
          language: data.language,
          images: data.images || [],
          conversation_id: data.conversation_id
        };
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error.message || 'Không thể kết nối đến server. Vui lòng thử lại sau.'
      };
    }
  }

  // Send voice message (authenticated or public)
  async sendVoiceMessage(text, language = null, conversationId = null) {
    try {
      const isAuth = this.isAuthenticated();
      const endpoint = isAuth ? '/voice-chat-authenticated' : '/voice-chat';
      
      const requestBody = { text };
      if (language) requestBody.language = language;
      if (conversationId && isAuth) requestBody.conversation_id = conversationId;

      console.log(`🎤 Sending voice message to ${endpoint}:`, { 
        text: text.substring(0, 50) + '...', 
        language, 
        conversationId,
        isAuth 
      });

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: isAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          message: data.response,
          language: data.language,
          audio: data.audio
        };
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Voice API Error:', error);
      return {
        success: false,
        error: error.message || 'Không thể kết nối đến server. Vui lòng thử lại sau.'
      };
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
