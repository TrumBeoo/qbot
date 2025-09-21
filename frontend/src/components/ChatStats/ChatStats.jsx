// src/components/ChatStats/ChatStats.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  useToast,
  useColorModeValue,
  Spinner,
  Badge,
  Divider,
  SimpleGrid,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { 
  FaSearch, 
  FaDownload, 
  FaComments, 
  FaCalendarAlt, 
  FaClock,
  FaLanguage,
  FaChartBar
} from 'react-icons/fa';
import { chatHistoryService } from '../../services/chatHistoryService';

const ChatStats = ({ language = 'vi', onSearchResults }) => {
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await chatHistoryService.getConversationStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation statistics',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await chatHistoryService.searchConversations(searchQuery.trim());
      if (response.success) {
        setSearchResults(response.results);
        if (onSearchResults) {
          onSearchResults(response.results, searchQuery);
        }
        toast({
          title: 'Search Complete',
          description: `Found ${response.results.length} results`,
          status: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast({
        title: 'Search Error',
        description: error.message || 'Failed to search conversations',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await chatHistoryService.exportConversations();
      if (response.success) {
        // Download the exported data
        chatHistoryService.downloadExportedData(
          response.data,
          `chat_export_${new Date().toISOString().split('T')[0]}.json`
        );
        toast({
          title: 'Export Complete',
          description: 'Your conversations have been exported successfully',
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'Export Error',
        description: error.message || 'Failed to export conversations',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold">
            Chat Statistics & Tools
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadStats}
            isLoading={isLoadingStats}
          >
            Refresh
          </Button>
        </HStack>

        <Divider />

        {/* Search */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="md" fontWeight="semibold">
            Search Conversations
          </Text>
          <HStack>
            <InputGroup>
              <InputLeftElement>
                <FaSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search in conversations and messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </InputGroup>
            <Button
              onClick={handleSearch}
              isLoading={isSearching}
              colorScheme="blue"
              size="md"
            >
              Search
            </Button>
          </HStack>
          
          {searchResults.length > 0 && (
            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Found {searchResults.length} results:
              </Text>
              <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                {searchResults.map((result, index) => (
                  <Box
                    key={index}
                    p={3}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    <Text fontSize="sm" fontWeight="semibold" mb={1}>
                      {result.conversation_title || 'Untitled Conversation'}
                    </Text>
                    <Text fontSize="xs" color="gray.600" noOfLines={2}>
                      {result.content}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {formatDate(result.created_at)}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>

        <Divider />

        {/* Export */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Text fontSize="md" fontWeight="semibold">
              Export Data
            </Text>
            <Text fontSize="sm" color="gray.600">
              Download all your conversations as JSON
            </Text>
          </VStack>
          <Button
            leftIcon={<FaDownload />}
            onClick={handleExport}
            isLoading={isExporting}
            colorScheme="green"
            size="sm"
          >
            Export
          </Button>
        </HStack>

        <Divider />

        {/* Statistics */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="md" fontWeight="semibold">
            Statistics
          </Text>
          
          {isLoadingStats ? (
            <HStack justify="center" py={4}>
              <Spinner size="md" />
              <Text>Loading statistics...</Text>
            </HStack>
          ) : stats ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={FaComments} />
                    <Text>Total Conversations</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{stats.total_conversations || 0}</StatNumber>
                <StatHelpText>All time</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={FaChartBar} />
                    <Text>Total Messages</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{stats.total_messages || 0}</StatNumber>
                <StatHelpText>All conversations</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={FaCalendarAlt} />
                    <Text>This Month</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{stats.conversations_this_month || 0}</StatNumber>
                <StatHelpText>New conversations</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={FaClock} />
                    <Text>Last Activity</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="sm">
                  {stats.last_conversation_date 
                    ? formatDate(stats.last_conversation_date)
                    : 'N/A'
                  }
                </StatNumber>
                <StatHelpText>Most recent</StatHelpText>
              </Stat>
            </SimpleGrid>
          ) : (
            <Text color="gray.500" textAlign="center" py={4}>
              No statistics available
            </Text>
          )}

          {/* Language breakdown */}
          {stats?.language_breakdown && (
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                <Icon as={FaLanguage} mr={2} />
                Language Usage
              </Text>
              <HStack spacing={2} wrap="wrap">
                {Object.entries(stats.language_breakdown).map(([lang, count]) => (
                  <Badge key={lang} colorScheme={lang === 'vi' ? 'green' : 'blue'}>
                    {lang.toUpperCase()}: {count}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default ChatStats;