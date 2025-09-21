// src/components/SearchResults/SearchResults.jsx
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
  Button,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { FaSearch, FaTimes, FaComment, FaCalendarAlt } from 'react-icons/fa';

const SearchResults = ({ 
  results = [], 
  query = '', 
  onClose, 
  onSelectConversation,
  language = 'vi' 
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return language === 'vi' ? 'Hôm nay' : 'Today';
    } else if (diffDays === 2) {
      return language === 'vi' ? 'Hôm qua' : 'Yesterday';
    } else if (diffDays <= 7) {
      return language === 'vi' ? `${diffDays} ngày trước` : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Box as="span" key={index} bg="yellow.200" color="black" px={1} borderRadius="sm">
          {part}
        </Box>
      ) : (
        part
      )
    );
  };

  if (!results || results.length === 0) {
    return (
      <Box
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        mb={4}
      >
        <HStack justify="space-between" align="center" mb={3}>
          <HStack>
            <Icon as={FaSearch} color="gray.500" />
            <Text fontSize="md" fontWeight="semibold">
              {language === 'vi' ? 'Kết quả tìm kiếm' : 'Search Results'}
            </Text>
            {query && (
              <Badge colorScheme="blue" variant="subtle">
                "{query}"
              </Badge>
            )}
          </HStack>
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              <FaTimes />
            </Button>
          )}
        </HStack>
        
        <Text color="gray.500" textAlign="center" py={4}>
          {language === 'vi' 
            ? 'Không tìm thấy kết quả nào' 
            : 'No results found'
          }
        </Text>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <HStack justify="space-between" align="center" mb={3}>
        <HStack>
          <Icon as={FaSearch} color="blue.500" />
          <Text fontSize="md" fontWeight="semibold">
            {language === 'vi' ? 'Kết quả tìm kiếm' : 'Search Results'}
          </Text>
          <Badge colorScheme="blue" variant="subtle">
            "{query}"
          </Badge>
          <Badge colorScheme="green" variant="outline">
            {results.length} {language === 'vi' ? 'kết quả' : 'results'}
          </Badge>
        </HStack>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose}>
            <FaTimes />
          </Button>
        )}
      </HStack>

      <Divider mb={3} />

      <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
        {results.map((result, index) => (
          <Box
            key={index}
            p={3}
            bg={hoverBg}
            borderRadius="md"
            border="1px solid"
            borderColor={borderColor}
            cursor={onSelectConversation ? "pointer" : "default"}
            _hover={onSelectConversation ? { 
              borderColor: "blue.300",
              boxShadow: "sm" 
            } : {}}
            onClick={() => onSelectConversation && onSelectConversation(result.conversation_id)}
            transition="all 0.2s"
          >
            <VStack align="start" spacing={2}>
              {/* Conversation title */}
              <HStack justify="space-between" w="full">
                <HStack>
                  <Icon as={FaComment} color="blue.500" size="sm" />
                  <Text fontSize="sm" fontWeight="semibold" color="blue.600">
                    {result.conversation_title || (language === 'vi' ? 'Cuộc trò chuyện không có tiêu đề' : 'Untitled Conversation')}
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FaCalendarAlt} color="gray.400" size="xs" />
                  <Text fontSize="xs" color="gray.500">
                    {formatDate(result.created_at)}
                  </Text>
                </HStack>
              </HStack>

              {/* Message content with highlighting */}
              <Box>
                <Text fontSize="sm" color="gray.700" noOfLines={3}>
                  {highlightText(result.content, query)}
                </Text>
              </Box>

              {/* Message metadata */}
              <HStack spacing={3}>
                <Badge 
                  size="sm" 
                  colorScheme={result.sender === 'user' ? 'blue' : 'green'}
                  variant="subtle"
                >
                  {result.sender === 'user' 
                    ? (language === 'vi' ? 'Người dùng' : 'User')
                    : (language === 'vi' ? 'Bot' : 'Bot')
                  }
                </Badge>
                
                {result.language && (
                  <Badge size="sm" colorScheme="purple" variant="outline">
                    {result.language.toUpperCase()}
                  </Badge>
                )}
                
                <Text fontSize="xs" color="gray.400">
                  {language === 'vi' ? 'Tin nhắn' : 'Message'} #{result.message_id}
                </Text>
              </HStack>
            </VStack>
          </Box>
        ))}
      </VStack>

      {results.length > 10 && (
        <Box mt={3} pt={3} borderTop="1px solid" borderColor={borderColor}>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            {language === 'vi' 
              ? `Hiển thị ${Math.min(10, results.length)} trong ${results.length} kết quả`
              : `Showing ${Math.min(10, results.length)} of ${results.length} results`
            }
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;