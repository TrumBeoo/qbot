// frontend/src/App.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  useToast,
  useColorModeValue,
  Spinner,
  Center,
  VStack,
  Text,
} from '@chakra-ui/react';

// Components
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import ChatHeader from './components/ChatbotHeader/ChatbotHeader';
import ChatArea from './components/ChatArea/ChatArea';
import ChatInput from './components/ChatInput/ChatInput';
import Sidebar from './components/Sidebar/Sidebar';
import VoiceInterface from './components/VoiceInterface/VoiceInterface';
import TypingText from './components/Typing/TypingText';

// Hooks and Constants
import { translations, chatbotConfig } from './constants';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { apiService } from './services/api_chat';
import { chatHistoryService } from './services/chatHistoryService';

// Loading component
const LoadingScreen = ({ message = "Loading..." }) => (
  <Center minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
    <VStack spacing={4}>
      <Spinner size="xl" color="blue.500" thickness="4px" />
      <Text fontSize="lg" color="gray.600">{message}</Text>
    </VStack>
  </Center>
);

function App() {
  // Theme and Auth hooks
  const { bgSecondary } = useTheme();
  const { 
    user, 
    login, 
    register, 
    socialLogin, 
    logout, 
    loading: authLoading 
  } = useAuth();
  
  // States
  const [showWelcome, setShowWelcome] = useState(!user);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'vi';
  });
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  
  // Hooks
  const toast = useToast();

  // Save language preference
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Load conversations when user logs in
  useEffect(() => {
    if (user && !authLoading) {
      setShowWelcome(false);
      loadConversations();
    } else if (!user) {
      setShowWelcome(true);
      setConversations([]);
      setCurrentConversation(null);
    }
  }, [user, authLoading]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // Toast utility
  const showToast = useCallback((title, description, status) => {
    toast({
      title,
      description,
      status,
      duration: status === 'error' ? 5000 : 3000,
      isClosable: true,
      position: 'top',
    });
  }, [toast]);

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await chatHistoryService.getConversations();
      if (response.success) {
        setConversations(response.conversations);
        
        // Load current conversation if exists
        const savedConvId = localStorage.getItem('currentConversationId');
        if (savedConvId) {
          const conversation = response.conversations.find(c => c._id === savedConvId);
          if (conversation) {
            await selectConversation(savedConvId);
          }
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [user]);

  // Create new conversation
  const createNewConversation = useCallback(async (title) => {
    if (!user) return null;
    
    try {
      const response = await chatHistoryService.createConversation(title);
      if (response.success) {
        const newConversation = response.conversation;
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversation(newConversation);
        setMessages([]);
        localStorage.setItem('currentConversationId', newConversation._id);
        return newConversation;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      showToast('Error', 'Failed to create new conversation', 'error');
    }
    return null;
  }, [user, showToast]);

  // Select conversation
  const selectConversation = useCallback(async (conversationId) => {
    if (!user || !conversationId) return;
    
    try {
      const response = await chatHistoryService.getConversation(conversationId);
      if (response.success) {
        const conversation = response.conversation;
        setCurrentConversation(conversation);
        setMessages(conversation.messages || []);
        localStorage.setItem('currentConversationId', conversationId);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      showToast('Error', 'Failed to load conversation', 'error');
    }
  }, [user, showToast]);

  // Event handlers
  const handleLanguageChange = useCallback(() => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
  }, [language]);

  const handleStartChat = useCallback(() => {
    setShowWelcome(false);
  }, []);

  // Authentication handlers
  const handleLogin = useCallback(async (email, password) => {
    try {
      const result = await login(email, password);
      if (result.success) {
        showToast('Success', 'Logged in successfully!', 'success');
        return result;
      } else {
        showToast('Login Failed', result.error, 'error');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [login, showToast]);

  const handleRegister = useCallback(async (name, email, password) => {
    try {
      const result = await register(name, email, password);
      if (result.success) {
        showToast('Success', 'Account created successfully!', 'success');
        return result;
      } else {
        showToast('Registration Failed', result.error, 'error');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, [register, showToast]);

  const handleSocialLogin = useCallback(async (provider, token) => {
    try {
      const result = await socialLogin(provider, token);
      if (result.success) {
        showToast('Success', `Logged in with ${provider} successfully!`, 'success');
        return result;
      } else {
        showToast(`${provider} Login Failed`, result.error, 'error');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      throw error;
    }
  }, [socialLogin, showToast]);



  const handleLogout = useCallback(() => {
    logout();
    setConversations([]);
    setCurrentConversation(null);
    setMessages([]);
    localStorage.removeItem('currentConversationId');
    showToast('Success', 'Logged out successfully!', 'success');
  }, [logout, showToast]);

  // Chat handlers
  const handleSend = useCallback(async (messageText = inputText) => {
    if (!messageText?.trim()) return;

    const trimmedMessage = messageText.trim();
    
    // Create user message
    const userMessage = {
      id: `user-${Date.now()}`,
      text: trimmedMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call the backend API
      const response = await apiService.sendMessage(trimmedMessage);
      
      if (response.success) {
        const botMessage = {
          id: `bot-${Date.now()}`,
          text: response.message,
          sender: 'bot',
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMessage]);

        // Save to chat history if user is logged in
        if (user) {
          try {
            let conversationId = currentConversation?._id;
            
            // Create new conversation if none exists
            if (!conversationId) {
              const title = chatHistoryService.generateConversationTitle(trimmedMessage);
              const newConv = await createNewConversation(title);
              conversationId = newConv?._id;
            }
            
            // Save messages to conversation
            if (conversationId) {
              await chatHistoryService.addMessage(
                conversationId, 
                trimmedMessage, 
                response.message, 
                language
              );
              
              // Refresh conversations list
              loadConversations();
            }
          } catch (historyError) {
            console.error('Error saving to chat history:', historyError);
            // Don't show error toast for history save failure
          }
        }
      } else {
        // Handle API error
        const errorMessage = {
          id: `bot-${Date.now()}`,
          text: response.error || 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          isError: true
        };

        setMessages(prev => [...prev, errorMessage]);
        showToast('Lỗi kết nối', response.error || 'Không thể kết nối đến server', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: `bot-${Date.now()}`,
        text: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };

     setMessages(prev => [...prev, errorMessage]);
     
     showToast(
       'Lỗi kết nối',
       'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
       'error'
     );
   } finally {
     setIsLoading(false);
   }
 }, [inputText, language, showToast, user, currentConversation, createNewConversation, loadConversations]);

 const handleSubmit = useCallback((e) => {
   e.preventDefault();
   if (!isLoading && inputText.trim()) {
     handleSend();
   }
 }, [handleSend, isLoading, inputText]);

 const toggleSidebar = useCallback(() => {
   setIsSidebarOpen(prev => !prev);
 }, []);

 // Voice handlers
 const handleVoiceClick = useCallback(() => {
   setIsVoiceOpen(true);
 }, []);

 const handleVoiceClose = useCallback(() => {
   setIsVoiceOpen(false);
 }, []);

 const handleVoiceResult = useCallback((userText, botText) => {
   const u = (userText || '').trim();
   if (!u) return;
   
   const userMessage = {
     id: `user-${Date.now()}`,
     text: u,
     sender: 'user',
     timestamp: new Date().toISOString()
   };
   setMessages(prev => [...prev, userMessage]);
   setInputText('');

   const bot = (botText || '').trim();
   if (bot) {
     const botMessage = {
       id: `bot-${Date.now()}`,
       text: bot,
       sender: 'bot',
       timestamp: new Date().toISOString()
     };
     setMessages(prev => [...prev, botMessage]);
   } else {
     handleSend(u);
   }
 }, [handleSend]);

 // Conversation management
 const handleNewConversation = useCallback(async () => {
   const newConv = await createNewConversation('New Conversation');
   if (newConv) {
     setMessages([]);
   }
 }, [createNewConversation]);

 const handleDeleteConversation = useCallback(async (conversationId) => {
   if (!user) return;
   
   try {
     await chatHistoryService.deleteConversation(conversationId);
     setConversations(prev => prev.filter(c => c._id !== conversationId));
     
     if (currentConversation?._id === conversationId) {
       setCurrentConversation(null);
       setMessages([]);
       localStorage.removeItem('currentConversationId');
     }
     
     showToast('Success', 'Conversation deleted successfully', 'success');
   } catch (error) {
     console.error('Error deleting conversation:', error);
     showToast('Error', 'Failed to delete conversation', 'error');
   }
 }, [user, currentConversation, showToast]);

 const handleRenameConversation = useCallback(async (conversationId, newTitle) => {
   if (!user || !newTitle.trim()) return;
   
   try {
     await chatHistoryService.updateConversation(conversationId, { title: newTitle.trim() });
     setConversations(prev => 
       prev.map(c => c._id === conversationId ? { ...c, title: newTitle.trim() } : c)
     );
     
     if (currentConversation?._id === conversationId) {
       setCurrentConversation(prev => ({ ...prev, title: newTitle.trim() }));
     }
     
     showToast('Success', 'Conversation renamed successfully', 'success');
   } catch (error) {
     console.error('Error renaming conversation:', error);
     showToast('Error', 'Failed to rename conversation', 'error');
   }
 }, [user, currentConversation, showToast]);

 // Loading screen during auth initialization
 if (authLoading) {
   return <LoadingScreen message="Initializing..." />;
 }

 // Render welcome screen
 if (showWelcome) {
   return (
     <WelcomeScreen
       language={language}
       onStart={handleStartChat}
       onLanguageChange={handleLanguageChange}
       onRegister={handleRegister}
       onLogin={handleLogin}
       onSocialLogin={handleSocialLogin}
       onLogout={handleLogout}
       user={user}
     />
   );
 }

 // Main chat interface
 return (
   <Flex h="100vh" bg={bgSecondary}>
     {/* Sidebar */}
     <Sidebar
       isOpen={isSidebarOpen}
       onClose={() => setIsSidebarOpen(false)}
       conversations={conversations}
       currentConversation={currentConversation}
       onSelectConversation={selectConversation}
       onNewConversation={handleNewConversation}
       onDeleteConversation={handleDeleteConversation}
       onRenameConversation={handleRenameConversation}
       user={user}
       language={language}
       onLogout={handleLogout}
       onProfile={() => console.log('Profile clicked')}
     />

     {/* Main Chat Area */}
     <Flex flex="1" direction="column" overflow="hidden">
       <ChatHeader
         language={language}
         onLanguageChange={handleLanguageChange}
         onToggleSidebar={toggleSidebar}
         user={user}
         onLogin={handleLogin}
         onRegister={handleRegister}
         onSocialLogin={handleSocialLogin}
         currentConversation={currentConversation}
         config={chatbotConfig}
       />
       
       <Flex flex="1" direction="column" overflow="hidden">
         <Box flex="1" overflow="hidden">
           <ChatArea
             messages={messages}
             messagesEndRef={messagesEndRef}
             language={language}
             isLoading={isLoading}
             config={chatbotConfig}
           />
         </Box>
         <Box w="full" px={4} pb={4}>
           <Box maxW="700px" mx="auto">
             <ChatInput
               inputText={inputText}
               setInputText={setInputText}
               onSubmit={handleSubmit}
               isLoading={isLoading}
               language={language}
               config={chatbotConfig}
               onVoiceClick={handleVoiceClick}
               onMapClick={() => setInputText('Tôi muốn xem bản đồ các địa điểm du lịch ở Quảng Ninh')}
               onRouteClick={() => setInputText('Tôi muốn tìm đường từ ')}
               onLocationClick={() => setInputText('Các địa điểm du lịch gần đây là gì?')}
               onDirectionClick={() => setInputText('Hướng dẫn đi từ Hà Nội đến Quảng Ninh')}
             />
           </Box>
         </Box>
       </Flex>
     </Flex>

     {/* Voice Interface Modal */}
     <VoiceInterface
       isOpen={isVoiceOpen}
       onClose={handleVoiceClose}
       onVoiceResult={handleVoiceResult}
       language={language}
     />
   </Flex>
 );
}

export default App;
          