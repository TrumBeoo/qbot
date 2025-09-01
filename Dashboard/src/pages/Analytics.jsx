// src/pages/Analytics.jsx
import {
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  useColorModeValue,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  VStack,
  HStack,
  Badge,
  Progress,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { chatbotAPI } from '../services/api';

const AnalyticsPage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const [chatbotStats, setChatbotStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChatbotStats();
  }, []);

  const fetchChatbotStats = async () => {
    try {
      setLoading(true);
      const response = await chatbotAPI.getStats();
      setChatbotStats(response.data.data);
      setError(null);
    } catch (err) {
      setError('Không thể tải dữ liệu phân tích');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb="6">
        Báo cáo & Phân tích Chatbot
      </Heading>

      {error && (
        <Alert status="error" mb="6">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Tabs>
        <TabList>
          <Tab>Tổng quan</Tab>
          <Tab>Hoạt động hàng ngày</Tab>
          <Tab>Phân tích ngôn ngữ</Tab>
          <Tab>Hiệu suất hệ thống</Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            {chatbotStats && (
              <VStack spacing="6" align="stretch">
                {/* Key Metrics */}
                <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="6">
                  <GridItem>
                    <Card bg={cardBg}>
                      <CardBody>
                        <Stat>
                          <StatLabel>Tổng cuộc trò chuyện</StatLabel>
                          <StatNumber>{chatbotStats.conversations?.total || 0}</StatNumber>
                          <StatHelpText>
                            <Badge colorScheme="green">
                              +{chatbotStats.conversations?.recent_30_days || 0} trong 30 ngày
                            </Badge>
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                  </GridItem>

                  <GridItem>
                    <Card bg={cardBg}>
                      <CardBody>
                        <Stat>
                          <StatLabel>Tổng tin nhắn</StatLabel>
                          <StatNumber>{chatbotStats.conversations?.total_messages || 0}</StatNumber>
                          <StatHelpText>
                            Trung bình {chatbotStats.conversations?.total_messages && chatbotStats.conversations?.total ? 
                              Math.round(chatbotStats.conversations.total_messages / chatbotStats.conversations.total) : 0} tin nhắn/cuộc trò chuyện
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                  </GridItem>

                  <GridItem>
                    <Card bg={cardBg}>
                      <CardBody>
                        <Stat>
                          <StatLabel>Người dùng hoạt động</StatLabel>
                          <StatNumber>{chatbotStats.conversations?.active_users || 0}</StatNumber>
                          <StatHelpText>
                            Đã sử dụng chatbot
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                  </GridItem>

                  <GridItem>
                    <Card bg={cardBg}>
                      <CardBody>
                        <Stat>
                          <StatLabel>Tài liệu trong hệ thống</StatLabel>
                          <StatNumber>{chatbotStats.rag_system?.document_count || 0}</StatNumber>
                          <StatHelpText>
                            Chunks dữ liệu
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                  </GridItem>
                </Grid>

                {/* Usage Trend */}
                <Card bg={cardBg}>
                  <CardBody>
                    <Heading size="md" mb="4">Xu hướng sử dụng</Heading>
                    <VStack spacing="3" align="stretch">
                      <HStack justify="space-between">
                        <Text>Tỷ lệ sử dụng trong 30 ngày qua</Text>
                        <Badge colorScheme="blue">
                          {chatbotStats.conversations?.total ? 
                            Math.round((chatbotStats.conversations.recent_30_days / chatbotStats.conversations.total) * 100) : 0}%
                        </Badge>
                      </HStack>
                      <Progress 
                        value={chatbotStats.conversations?.total ? 
                          (chatbotStats.conversations.recent_30_days / chatbotStats.conversations.total) * 100 : 0} 
                        colorScheme="blue" 
                      />
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </TabPanel>

          {/* Daily Activity Tab */}
          <TabPanel>
            {chatbotStats?.daily_stats && (
              <Card bg={cardBg}>
                <CardBody>
                  <Heading size="md" mb="4">Hoạt động 7 ngày qua</Heading>
                  <VStack spacing="4" align="stretch">
                    {chatbotStats.daily_stats.map((day, index) => (
                      <HStack key={index} justify="space-between" p="3" bg="gray.50" borderRadius="md">
                        <Text fontWeight="medium">
                          {new Date(day.date).toLocaleDateString('vi-VN', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                        <Badge colorScheme={day.conversations > 0 ? 'green' : 'gray'} fontSize="sm">
                          {day.conversations} cuộc trò chuyện
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            )}
          </TabPanel>

          {/* Language Analysis Tab */}
          <TabPanel>
            {chatbotStats?.language_distribution && (
              <Card bg={cardBg}>
                <CardBody>
                  <Heading size="md" mb="4">Phân bố ngôn ngữ sử dụng</Heading>
                  <VStack spacing="4" align="stretch">
                    {chatbotStats.language_distribution.map((lang, index) => {
                      const total = chatbotStats.language_distribution.reduce((sum, l) => sum + l.count, 0);
                      const percentage = Math.round((lang.count / total) * 100);
                      
                      return (
                        <Box key={index}>
                          <HStack justify="space-between" mb="2">
                            <Text fontWeight="medium">
                              {lang._id === 'vi' ? 'Tiếng Việt' : 'English'}
                            </Text>
                            <HStack>
                              <Text>{lang.count} tin nhắn</Text>
                              <Badge colorScheme={lang._id === 'vi' ? 'blue' : 'green'}>
                                {percentage}%
                              </Badge>
                            </HStack>
                          </HStack>
                          <Progress 
                            value={percentage} 
                            colorScheme={lang._id === 'vi' ? 'blue' : 'green'} 
                          />
                        </Box>
                      );
                    })}
                  </VStack>
                </CardBody>
              </Card>
            )}
          </TabPanel>

          {/* System Performance Tab */}
          <TabPanel>
            {chatbotStats?.rag_system && (
              <VStack spacing="6" align="stretch">
                <Card bg={cardBg}>
                  <CardBody>
                    <Heading size="md" mb="4">Thông tin hệ thống RAG</Heading>
                    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap="4">
                      <VStack align="start" spacing="2">
                        <Text><strong>LLM Model:</strong></Text>
                        <Badge colorScheme="purple" p="2">
                          {chatbotStats.rag_system.llm_model || 'N/A'}
                        </Badge>
                      </VStack>
                      
                      <VStack align="start" spacing="2">
                        <Text><strong>Embedding Model:</strong></Text>
                        <Badge colorScheme="blue" p="2">
                          {chatbotStats.rag_system.embedding_model?.split('/').pop() || 'N/A'}
                        </Badge>
                      </VStack>
                      
                      <VStack align="start" spacing="2">
                        <Text><strong>Chunk Size:</strong></Text>
                        <Badge colorScheme="green" p="2">
                          {chatbotStats.rag_system.chunk_size || 'N/A'}
                        </Badge>
                      </VStack>
                      
                      <VStack align="start" spacing="2">
                        <Text><strong>Chunk Overlap:</strong></Text>
                        <Badge colorScheme="orange" p="2">
                          {chatbotStats.rag_system.chunk_overlap || 'N/A'}
                        </Badge>
                      </VStack>
                    </Grid>
                  </CardBody>
                </Card>

                <Card bg={cardBg}>
                  <CardBody>
                    <Heading size="md" mb="4">Trạng thái cập nhật</Heading>
                    <VStack align="start" spacing="3">
                      {chatbotStats.rag_system.last_build_time && (
                        <HStack>
                          <Text><strong>Cập nhật cuối:</strong></Text>
                          <Badge colorScheme="gray">
                            {new Date(chatbotStats.rag_system.last_build_time * 1000).toLocaleString('vi-VN')}
                          </Badge>
                        </HStack>
                      )}
                      
                      <HStack>
                        <Text><strong>Số lượng documents:</strong></Text>
                        <Badge colorScheme="blue">
                          {chatbotStats.rag_system.document_count || 0} chunks
                        </Badge>
                      </HStack>
                      
                      <HStack>
                        <Text><strong>Thư mục dữ liệu:</strong></Text>
                        <Text fontSize="sm" color="gray.600">
                          {chatbotStats.rag_system.data_directory || 'N/A'}
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AnalyticsPage;
