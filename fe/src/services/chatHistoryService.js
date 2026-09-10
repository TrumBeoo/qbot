const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5555';

class ChatHistoryService {
  // Get authorization headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Get all conversations for the current user
  async getConversations(limit = 50, skip = 0) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations?limit=${limit}&skip=${skip}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get conversations');
      }

      return {
        success: true,
        conversations: data.data || []
      };
    } catch (error) {
      console.error('Get conversations error:', error);
      throw new Error(error.message || 'Failed to get conversations');
    }
  }

  // Create a new conversation
  async createConversation(title = 'New Conversation') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ title })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create conversation');
      }

      return {
        success: true,
        conversation: data.data,
        conversationId: data.data?.conversation_id || data.data?.id,
        message: data.message
      };
    } catch (error) {
      console.error('Create conversation error:', error);
      throw new Error(error.message || 'Failed to create conversation');
    }
  }

  // Get a specific conversation with all messages
  async getConversation(conversationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get conversation');
      }

      return {
        success: true,
        conversation: data.data
      };
    } catch (error) {
      console.error('Get conversation error:', error);
      throw new Error(error.message || 'Failed to get conversation');
    }
  }

  // Add a message to a conversation
  async addMessage(conversationId, userMessage, botResponse = '', language = 'vi') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          user_message: userMessage,
          bot_response: botResponse,
          language
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add message');
      }

      return {
        success: true,
        messages: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Add message error:', error);
      throw new Error(error.message || 'Failed to add message');
    }
  }

  // Update conversation title
  async updateConversation(conversationId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update conversation');
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Update conversation error:', error);
      throw new Error(error.message || 'Failed to update conversation');
    }
  }

  // Delete a conversation
  async deleteConversation(conversationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete conversation');
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw new Error(error.message || 'Failed to delete conversation');
    }
  }

  // Delete a specific message
  async deleteMessage(conversationId, messageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete message');
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Delete message error:', error);
      throw new Error(error.message || 'Failed to delete message');
    }
  }

  // Search conversations and messages
  async searchConversations(query, limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search conversations');
      }

      return {
        success: true,
        results: data.data,
        query: data.query
      };
    } catch (error) {
      console.error('Search conversations error:', error);
      throw new Error(error.message || 'Failed to search conversations');
    }
  }

  // Export all conversations
  async exportConversations() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/export`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to export conversations');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Export conversations error:', error);
      throw new Error(error.message || 'Failed to export conversations');
    }
  }

  // Get conversation statistics
  async getConversationStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get conversation stats');
      }

      return {
        success: true,
        stats: data.data
      };
    } catch (error) {
      console.error('Get conversation stats error:', error);
      throw new Error(error.message || 'Failed to get conversation stats');
    }
  }

  // Legacy support - Save chat history
  async saveChatHistory(userMessage, botResponse, language = 'vi', conversationId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/history`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          user_message: userMessage,
          bot_response: botResponse,
          language,
          conversation_id: conversationId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save chat history');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Save chat history error:', error);
      throw new Error(error.message || 'Failed to save chat history');
    }
  }

  // Legacy support - Get chat history
  async getChatHistory(limit = 50, skip = 0) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/history?limit=${limit}&skip=${skip}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get chat history');
      }

      return {
        success: true,
        history: data.data
      };
    } catch (error) {
      console.error('Get chat history error:', error);
      throw new Error(error.message || 'Failed to get chat history');
    }
  }

  // Helper method to generate conversation title from first message
  generateConversationTitle(firstMessage, maxLength = 50) {
    if (!firstMessage) return 'New Conversation';
    
    const title = firstMessage.trim();
    if (title.length <= maxLength) return title;
    
    return title.substring(0, maxLength - 3) + '...';
  }

  // Helper method to download exported data as JSON file
  downloadExportedData(data, filename = 'chat_conversations_export.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Create and export singleton instance
export const chatHistoryService = new ChatHistoryService();
export default chatHistoryService;