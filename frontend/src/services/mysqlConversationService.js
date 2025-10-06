import { API_BASE_URL } from '../config/api';

class MySQLConversationService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authentication headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get all conversations for the current user
  async getConversations(limit = 50, skip = 0) {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/conversations?limit=${limit}&skip=${skip}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          conversations: data.conversations || [],
          total: data.total || 0,
          hasMore: data.hasMore || false
        };
      } else {
        throw new Error(data.message || 'Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching MySQL conversations:', error);
      return {
        success: false,
        error: error.message,
        conversations: [],
        total: 0,
        hasMore: false
      };
    }
  }

  // Create a new conversation
  async createConversation(title = 'New Conversation') {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/conversations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ title })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          conversation: data.conversation
        };
      } else {
        throw new Error(data.message || 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating MySQL conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get a specific conversation with all messages
  async getConversation(conversationId) {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/conversations/${conversationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          conversation: data.conversation
        };
      } else {
        throw new Error(data.message || 'Failed to fetch conversation');
      }
    } catch (error) {
      console.error('Error fetching MySQL conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Add a message to a conversation
  async addMessage(conversationId, userMessage, botResponse = '', language = 'vi') {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          user_message: userMessage,
          bot_response: botResponse,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          messages: data.messages
        };
      } else {
        throw new Error(data.message || 'Failed to add message');
      }
    } catch (error) {
      console.error('Error adding MySQL message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update conversation title
  async updateConversation(conversationId, updates) {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/conversations/${conversationId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          conversation: data.conversation
        };
      } else {
        throw new Error(data.message || 'Failed to update conversation');
      }
    } catch (error) {
      console.error('Error updating MySQL conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete a conversation
  async deleteConversation(conversationId) {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting MySQL conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete a specific message
  async deleteMessage(conversationId, messageId) {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/conversations/${conversationId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting MySQL message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Search conversations and messages
  async searchConversations(query, limit = 20) {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          results: data.results || []
        };
      } else {
        throw new Error(data.message || 'Failed to search conversations');
      }
    } catch (error) {
      console.error('Error searching MySQL conversations:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  // Export all conversations
  async exportConversations() {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/export`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to export conversations');
      }
    } catch (error) {
      console.error('Error exporting MySQL conversations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get conversation statistics
  async getConversationStats() {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          stats: data.stats
        };
      } else {
        throw new Error(data.message || 'Failed to get conversation stats');
      }
    } catch (error) {
      console.error('Error getting MySQL conversation stats:', error);
      return {
        success: false,
        error: error.message,
        stats: {}
      };
    }
  }

  // Get messages for a conversation with pagination
  async getMessages(conversationId, limit = 50, offset = 0) {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          messages: data.messages || [],
          total: data.total || 0,
          hasMore: data.hasMore || false
        };
      } else {
        throw new Error(data.message || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching MySQL messages:', error);
      return {
        success: false,
        error: error.message,
        messages: [],
        total: 0,
        hasMore: false
      };
    }
  }

  // Update message
  async updateMessage(conversationId, messageId, updates) {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/conversations/${conversationId}/messages/${messageId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to update message');
      }
    } catch (error) {
      console.error('Error updating MySQL message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clear all conversations for current user
  async clearAllConversations() {
    try {
      const response = await fetch(`${this.baseURL}/api/mysql-chat/conversations/clear`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to clear conversations');
      }
    } catch (error) {
      console.error('Error clearing MySQL conversations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const mysqlConversationService = new MySQLConversationService();
export default mysqlConversationService;