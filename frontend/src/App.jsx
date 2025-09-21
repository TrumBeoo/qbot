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
import MapView from './components/MapView/MapView';
import AdvancedMapView from './components/MapView/AdvancedMapView';
import ChatStats from './components/ChatStats/ChatStats';
import SearchResults from './components/SearchResults/SearchResults';

// Hooks and Constants
import { translations, chatbotConfig } from './constants';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { apiService } from './services/api_chat';
import { chatHistoryService } from './services/chatHistoryService';
import { mapService } from './services/mapService';

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
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isAdvancedMapOpen, setIsAdvancedMapOpen] = useState(false);
  const [mapQuery, setMapQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  
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
          const conversation = response.conversations.find(c => c.id === savedConvId);
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
        localStorage.setItem('currentConversationId', newConversation.id);
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
      console.log(`🔍 Loading conversation: ${conversationId}`);
      const response = await chatHistoryService.getConversation(conversationId);
      
      if (response.success) {
        const conversation = response.conversation;
        console.log(`📋 Conversation loaded:`, conversation);
        console.log(`💬 Messages count: ${conversation.messages?.length || 0}`);
        
        setCurrentConversation(conversation);
        
        // Format messages for display
        const formattedMessages = (conversation.messages || []).map(msg => ({
          id: msg.id,
          text: msg.content || msg.text,
          sender: msg.sender,
          timestamp: msg.timestamp || msg.created_at,
          language: msg.language || 'vi',
          images: Array.isArray(msg.images) ? msg.images : []
        }));
        
        console.log(`✅ Setting ${formattedMessages.length} messages`);
        setMessages(formattedMessages);
        localStorage.setItem('currentConversationId', conversationId);
      } else {
        console.error('❌ Failed to load conversation:', response.error);
        showToast('Error', 'Failed to load conversation', 'error');
      }
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
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
    
    // Check if message is map-related
    const mapQuery = mapService.parseLocationQuery(trimmedMessage);
    if (mapQuery) {
      // Handle map-related queries
      const mapResponse = mapService.generateMapResponse(mapQuery.type, mapQuery);
      
      // Create user message
      const userMessage = {
        id: `user-${Date.now()}`,
        text: trimmedMessage,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Create bot response message
      const botMessage = {
        id: `bot-${Date.now()}`,
        text: mapResponse,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };

      // Add messages
      setMessages(prev => [...prev, userMessage, botMessage]);
      setInputText('');

      // Open advanced map with appropriate query
      let searchQuery = '';
      if (mapQuery.type === 'findPlace') {
        searchQuery = mapService.formatLocationQuery(mapQuery.query, mapQuery.location);
      } else if (mapQuery.type === 'directions') {
        searchQuery = `${mapQuery.origin} to ${mapQuery.destination}`;
      } else if (mapQuery.type === 'nearbyPlaces') {
        searchQuery = mapQuery.query;
      } else {
        searchQuery = mapService.extractLocationFromMessage(trimmedMessage);
      }
      
      setMapQuery(searchQuery);
      setIsAdvancedMapOpen(true);
      return;
    }
    
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
      // Call the backend API with conversation_id if available
      const response = await apiService.sendMessage(
        trimmedMessage, 
        language, 
        currentConversation?.id
      );
      
      if (response.success) {
        console.log('📨 Bot message images:', response.images?.length || 0, response.images);
        const botMessage = {
          id: `bot-${Date.now()}`,
          text: response.message,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          images: Array.isArray(response.images) ? response.images : []
        };
        console.log('💬 Final bot message with images:', botMessage.images?.length || 0, 'images');

        setMessages(prev => [...prev, botMessage]);

        // Save to chat history if user is logged in and no conversation exists
        // (If conversation exists, backend already saves automatically)
        if (user && !currentConversation) {
          try {
            // Create new conversation if none exists
            const title = chatHistoryService.generateConversationTitle(trimmedMessage);
            const newConv = await createNewConversation(title);
            
            if (newConv) {
              // Refresh conversations list to get updated data
              loadConversations();
            }
          } catch (historyError) {
            console.error('Error creating new conversation:', historyError);
            // Don't show error toast for history save failure
          }
        } else if (user && currentConversation) {
          // Just refresh to get any updates from backend
          try {
            loadConversations();
          } catch (error) {
            console.error('Error refreshing conversations:', error);
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

 // Map handlers
 const handleMapOpen = useCallback((query = '') => {
   setMapQuery(query);
   setIsMapOpen(true);
 }, []);

 const handleMapClose = useCallback(() => {
   setIsMapOpen(false);
   setMapQuery('');
 }, []);

 const handleAdvancedMapOpen = useCallback((query = '', location = null) => {
   setMapQuery(query);
   setUserLocation(location);
   setIsAdvancedMapOpen(true);
 }, []);

 const handleAdvancedMapClose = useCallback(() => {
   setIsAdvancedMapOpen(false);
   setMapQuery('');
   setUserLocation(null);
 }, []);

 const handleMapClick = useCallback(() => {
   const query = 'Các địa điểm du lịch nổi tiếng Việt Nam';
   setInputText(query);
   handleSend(query);
 }, [handleSend]);

 const handleRouteClick = useCallback(() => {
   const query = 'Chỉ đường từ Hà Nội đến Hạ Long';
   setInputText(query);
   handleSend(query);
 }, [handleSend]);

 const handleLocationClick = useCallback(() => {
   const query = 'Tìm các địa điểm du lịch gần đây';
   setInputText(query);
   handleSend(query);
 }, [handleSend]);

 const handleDirectionClick = useCallback(() => {
   const query = 'Hướng dẫn đi từ Hà Nội đến Sapa';
   setInputText(query);
   handleSend(query);
 }, [handleSend]);

 const handleAdvancedMapClick = useCallback(() => {
   handleAdvancedMapOpen('Khám phá địa điểm du lịch Việt Nam');
 }, [handleAdvancedMapOpen]);

 const handleVoiceResult = useCallback((userText, botText) => {
   const u = (userText || '').trim();
   const bot = (botText || '').trim();
   
   if (!u) return;
   
   // Create user message
   const userMessage = {
     id: `user-${Date.now()}`,
     text: u,
     sender: 'user',
     timestamp: new Date().toISOString()
   };
   
   // Create bot message if we have a response
   const botMessage = bot ? {
     id: `bot-${Date.now()}`,
     text: bot,
     sender: 'bot',
     timestamp: new Date().toISOString()
   } : null;
   
   // Add messages to chat
   if (botMessage) {
     setMessages(prev => [...prev, userMessage, botMessage]);
   } else {
     setMessages(prev => [...prev, userMessage]);
   }
   
   setInputText('');
   
   // Save to chat history if user is logged in and we have both messages
   // Note: Voice chat with authentication should already save to backend automatically
   if (user && botMessage && !currentConversation) {
     (async () => {
       try {
         // Create new conversation if none exists
         const title = chatHistoryService.generateConversationTitle(u);
         const newConv = await createNewConversation(title);
         
         if (newConv) {
           // Refresh conversations list
           loadConversations();
         }
       } catch (historyError) {
         console.error('Error creating conversation for voice chat:', historyError);
       }
    })();
   } else if (user && currentConversation) {
     // Just refresh to get any updates from backend
     (async () => {
       try {
          loadConversations();
       } catch (error) {
         console.error('Error refreshing conversations after voice chat:', error);
       }
     })();
   }
 }, [user, currentConversation, createNewConversation, loadConversations, language]);

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
     setConversations(prev => prev.filter(c => c.id !== conversationId));
     
     if (currentConversation?.id === conversationId) {
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
       prev.map(c => c.id === conversationId ? { ...c, title: newTitle.trim() } : c)
     );
     
     if (currentConversation?.id === conversationId) {
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
       onLogin={handleLogin}
       onRegister={handleRegister}
       onSocialLogin={handleSocialLogin}
       onLanguageChange={handleLanguageChange}
     />

     {/* Main Chat Area */}
     <Flex flex="1" direction="column" overflow="hidden">
       <ChatHeader
         language={language}
         onLanguageChange={handleLanguageChange}
         onToggleSidebar={toggleSidebar}
         user={user}
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
               onMapClick={handleMapClick}
               onAdvancedMapClick={handleAdvancedMapClick}
               onRouteClick={handleRouteClick}
               onLocationClick={handleLocationClick}
               onDirectionClick={handleDirectionClick}
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
       currentConversation={currentConversation}
     />

     {/* Map View Modal */}
     <MapView
       isOpen={isMapOpen}
       onClose={handleMapClose}
       initialQuery={mapQuery}
     />

     {/* Advanced Map View Modal */}
     <AdvancedMapView
       isOpen={isAdvancedMapOpen}
       onClose={handleAdvancedMapClose}
       initialQuery={mapQuery}
       initialLocation={userLocation}
     />
   </Flex>
 );
}

export default App;
          