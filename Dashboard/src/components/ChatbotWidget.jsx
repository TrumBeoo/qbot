// src/components/ChatbotWidget.jsx
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Card,
  CardBody,
  Avatar,
  useColorModeValue,
  Spinner,
  Badge,
  IconButton,
  Collapse,
  useDisclosure,
  Select
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { ChatIcon, MinusIcon } from '@chakra-ui/icons';
import { chatbotAPI } from '../services/api';

const ChatbotWidget = ({ isEmbedded = false }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: isEmbedded });
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! Tôi là QBot - trợ lý du lịch Quảng Ninh. Tôi có thể giúp bạn tìm hiểu về các địa điểm du lịch, khách sạn, nhà hàng và nhiều thông tin hữu ích khác tại Quảng Ninh. Bạn có câu hỏi gì không?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('vi');
  const messagesEndRef = useRef(null);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const userBg = useColorModeValue('blue.500', 'blue.600');
  const botBg = useColorModeValue('gray.100', 'gray.700');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatbotAPI.testChatbot(inputValue, language);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.data.data.response?.answer || response.data.data.response,
        sender: 'bot',
        timestamp: new Date(),
        sources: response.data.data.response?.sources
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const MessageBubble = ({ message }) => (
    <HStack
      align="start"
      justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
      w="full"
      spacing="2"
    >
      {message.sender === 'bot' && (
        <Avatar size="sm" name="QBot" bg="green.500" color="white" />
      )}
      
      <VStack align={message.sender === 'user' ? 'flex-end' : 'flex-start'} spacing="1" maxW="80%">
        <Box
          bg={message.sender === 'user' ? userBg : (message.isError ? 'red.100' : botBg)}
          color={message.sender === 'user' ? 'white' : (message.isError ? 'red.800' : 'inherit')}
          px="3"
          py="2"
          borderRadius="lg"
          borderBottomLeftRadius={message.sender === 'bot' ? 'sm' : 'lg'}
          borderBottomRightRadius={message.sender === 'user' ? 'sm' : 'lg'}
        >
          <Text fontSize="sm" whiteSpace="pre-wrap">
            {message.text}
          </Text>
        </Box>
        
        {message.sources && message.sources.length > 0 && (
          <Box w="full">
            <Text fontSize="xs" color="gray.500" mb="1">Nguồn tham khảo:</Text>
            {message.sources.map((source, index) => (
              <Box key={index} bg="gray.50" p="2" borderRadius="md" mb="1">
                <Text fontSize="xs" fontWeight="semibold">{source.source}</Text>
                <Text fontSize="xs" color="gray.600" noOfLines="2">
                  {source.content}
                </Text>
              </Box>
            ))}
          </Box>
        )}
        
        <Text fontSize="xs" color="gray.500">
          {message.timestamp.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </VStack>
      
      {message.sender === 'user' && (
        <Avatar size="sm" name="User" bg="blue.500" />
      )}
    </HStack>
  );

  if (!isEmbedded) {
    return (
      <Box position="fixed" bottom="4" right="4" zIndex="1000">
        <Collapse in={isOpen} animateOpacity>
          <Card bg={cardBg} shadow="xl" w="400px" h="500px" mb="2">
            <CardBody p="0">
              <VStack h="full" spacing="0">
                {/* Header */}
                <HStack w="full" p="4" bg="blue.500" color="white" borderTopRadius="md">
                  <Avatar size="sm" name="QBot" bg="green.500" />
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontWeight="bold" fontSize="sm">QBot - Trợ lý Du lịch</Text>
                    <Text fontSize="xs" opacity="0.8">Quảng Ninh Tourism</Text>
                  </VStack>
                  <Select
                    size="sm"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    bg="white"
                    color="black"
                    w="80px"
                  >
                    <option value="vi">VI</option>
                    <option value="en">EN</option>
                  </Select>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    color="white"
                    icon={<MinusIcon />}
                    onClick={onToggle}
                  />
                </HStack>

                {/* Messages */}
                <VStack
                  flex="1"
                  w="full"
                  p="4"
                  spacing="4"
                  overflowY="auto"
                  align="stretch"
                >
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  
                  {isLoading && (
                    <HStack justify="flex-start" w="full">
                      <Avatar size="sm" name="QBot" bg="green.500" color="white" />
                      <Box bg={botBg} px="3" py="2" borderRadius="lg">
                        <HStack spacing="1">
                          <Spinner size="xs" />
                          <Text fontSize="sm">Đang trả lời...</Text>
                        </HStack>
                      </Box>
                    </HStack>
                  )}
                  
                  <div ref={messagesEndRef} />
                </VStack>

                {/* Input */}
                <HStack w="full" p="4" borderTop="1px" borderColor="gray.200">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập câu hỏi về du lịch Quảng Ninh..."
                    size="sm"
                    disabled={isLoading}
                  />
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={handleSendMessage}
                    isLoading={isLoading}
                    disabled={!inputValue.trim()}
                  >
                    Gửi
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </Collapse>

        <Button
          colorScheme="blue"
          borderRadius="full"
          size="lg"
          leftIcon={<ChatIcon />}
          onClick={onToggle}
          shadow="lg"
        >
          {isOpen ? 'Thu gọn' : 'Chat với QBot'}
        </Button>
      </Box>
    );
  }

  // Embedded version for dashboard
  return (
    <Card bg={cardBg} h="600px">
      <CardBody p="0">
        <VStack h="full" spacing="0">
          {/* Header */}
          <HStack w="full" p="4" bg="blue.500" color="white" borderTopRadius="md">
            <Avatar size="sm" name="QBot" bg="green.500" />
            <VStack align="start" spacing="0" flex="1">
              <Text fontWeight="bold" fontSize="sm">QBot - Trợ lý Du lịch</Text>
              <Text fontSize="xs" opacity="0.8">Test Chatbot trực tiếp</Text>
            </VStack>
            <Select
              size="sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              bg="white"
              color="black"
              w="80px"
            >
              <option value="vi">VI</option>
              <option value="en">EN</option>
            </Select>
          </HStack>

          {/* Messages */}
          <VStack
            flex="1"
            w="full"
            p="4"
            spacing="4"
            overflowY="auto"
            align="stretch"
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <HStack justify="flex-start" w="full">
                <Avatar size="sm" name="QBot" bg="green.500" color="white" />
                <Box bg={botBg} px="3" py="2" borderRadius="lg">
                  <HStack spacing="1">
                    <Spinner size="xs" />
                    <Text fontSize="sm">Đang trả lời...</Text>
                  </HStack>
                </Box>
              </HStack>
            )}
            
            <div ref={messagesEndRef} />
          </VStack>

          {/* Input */}
          <HStack w="full" p="4" borderTop="1px" borderColor="gray.200">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi về du lịch Quảng Ninh..."
              size="sm"
              disabled={isLoading}
            />
            <Button
              size="sm"
              colorScheme="blue"
              onClick={handleSendMessage}
              isLoading={isLoading}
              disabled={!inputValue.trim()}
            >
              Gửi
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ChatbotWidget;