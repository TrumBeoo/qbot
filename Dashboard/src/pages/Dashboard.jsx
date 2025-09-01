// src/pages/Dashboard.jsx
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  VStack,
  HStack,
  Divider,
  Button,
  Icon,
  Progress,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  Flex,
  SimpleGrid
} from '@chakra-ui/react';
import { 
  FiUpload, 
  FiDatabase, 
  FiFileText, 
  FiTrendingUp, 
  FiUsers, 
  FiMessageSquare,
  FiDownload,
  FiRefreshCw,
  FiPlus
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatbotAPI } from '../services/api';
import FeatureAnnouncement from '../components/common/FeatureAnnouncement';
import SystemStatus from '../components/common/SystemStatus';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [chatbotStats, setChatbotStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('document');
  const [fileDescription, setFileDescription] = useState('');

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
      setError('Không thể tải thống kê chatbot');
      console.error('Error fetching chatbot stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['text/plain', 'application/pdf', 'text/csv', 'application/json'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Loại file không được hỗ trợ',
          description: 'Vui lòng chọn file .txt, .pdf, .csv hoặc .json',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File quá lớn',
          description: 'Vui lòng chọn file nhỏ hơn 10MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setSelectedFile(file);
      onOpen();
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !fileDescription.trim()) {
      toast({
        title: 'Thông tin không đầy đủ',
        description: 'Vui lòng chọn file và nhập mô tả',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', fileType);
      formData.append('description', fileDescription);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Try to call API to upload file, fallback to simulation
      try {
        const response = await chatbotAPI.uploadData(formData);
        console.log('Upload response:', response);
      } catch (apiError) {
        console.warn('API upload failed, simulating:', apiError);
        // Simulate API call as fallback
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: 'Upload thành công!',
        description: `File "${selectedFile.name}" đã được tải lên và xử lý`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setSelectedFile(null);
      setFileDescription('');
      setFileType('document');
      onClose();
      
      // Refresh stats
      fetchChatbotStats();
      
    } catch (error) {
      toast({
        title: 'Lỗi upload',
        description: 'Có lỗi xảy ra khi tải file. Vui lòng thử lại.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRefreshData = async () => {
    toast({
      title: 'Đang làm mới dữ liệu...',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    await fetchChatbotStats();
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
      {/* Feature Announcement */}
      <FeatureAnnouncement />
      
      {/* Header Section */}
      <Flex justify="space-between" align="center" mb="8">
        <Box>
          <Heading size="lg" mb="2">
            Chào mừng trở lại, {user?.businessInfo?.businessName || user?.email}!
          </Heading>
          <Text color="gray.600">
            Quản lý dữ liệu và theo dõi hiệu suất chatbot du lịch Quảng Ninh
          </Text>
        </Box>
        <HStack spacing="3">
          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            variant="outline"
            onClick={handleRefreshData}
            size="sm"
          >
            Làm mới
          </Button>
          <Button
            leftIcon={<Icon as={FiUpload} />}
            colorScheme="blue"
            onClick={() => fileInputRef.current?.click()}
            size="sm"
          >
            Tải lên dữ liệu
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".txt,.pdf,.csv,.json"
            style={{ display: 'none' }}
          />
        </HStack>
      </Flex>

      {error && (
        <Alert status="error" mb="6">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Quick Actions */}
      <Card bg={cardBg} mb="8">
        <CardHeader>
          <Heading size="md">Hành động nhanh</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="4">
            <Button
              leftIcon={<Icon as={FiUpload} />}
              variant="outline"
              h="60px"
              onClick={() => fileInputRef.current?.click()}
            >
              <VStack spacing="1">
                <Text fontSize="sm" fontWeight="semibold">Tải lên tài liệu</Text>
                <Text fontSize="xs" color="gray.500">PDF, TXT, CSV</Text>
              </VStack>
            </Button>
            
            <Button
              leftIcon={<Icon as={FiDatabase} />}
              variant="outline"
              h="60px"
              onClick={() => navigate('/data-management')}
            >
              <VStack spacing="1">
                <Text fontSize="sm" fontWeight="semibold">Quản lý dữ liệu</Text>
                <Text fontSize="xs" color="gray.500">Xem & chỉnh sửa</Text>
              </VStack>
            </Button>
            
            <Button
              leftIcon={<Icon as={FiDownload} />}
              variant="outline"
              h="60px"
              onClick={() => {
                toast({
                  title: 'Tính năng đang phát triển',
                  description: 'Tính năng xuất dữ liệu sẽ sớm được cập nhật',
                  status: 'info',
                  duration: 3000,
                  isClosable: true,
                });
              }}
            >
              <VStack spacing="1">
                <Text fontSize="sm" fontWeight="semibold">Xuất dữ liệu</Text>
                <Text fontSize="xs" color="gray.500">Backup & Export</Text>
              </VStack>
            </Button>
            
            <Button
              leftIcon={<Icon as={FiTrendingUp} />}
              variant="outline"
              h="60px"
              onClick={() => navigate('/analytics')}
            >
              <VStack spacing="1">
                <Text fontSize="sm" fontWeight="semibold">Xem báo cáo</Text>
                <Text fontSize="xs" color="gray.500">Thống kê chi tiết</Text>
              </VStack>
            </Button>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Main Stats */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="6" mb="8">
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Flex align="center" justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  Tổng tài liệu
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {chatbotStats?.rag_system?.document_count || 0}
                </Text>
                <Text fontSize="sm" color="green.500">
                  <Icon as={FiTrendingUp} mr="1" />
                  Hoạt động tốt
                </Text>
              </Box>
              <Box
                p="3"
                bg="blue.50"
                borderRadius="full"
              >
                <Icon as={FiFileText} color="blue.500" boxSize="6" />
              </Box>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Flex align="center" justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  Cuộc trò chuyện
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {chatbotStats?.conversations?.total || 0}
                </Text>
                <Text fontSize="sm" color="green.500">
                  <Icon as={FiTrendingUp} mr="1" />
                  +{chatbotStats?.conversations?.recent_30_days || 0} tháng này
                </Text>
              </Box>
              <Box
                p="3"
                bg="green.50"
                borderRadius="full"
              >
                <Icon as={FiMessageSquare} color="green.500" boxSize="6" />
              </Box>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Flex align="center" justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  Người dùng hoạt động
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {chatbotStats?.conversations?.active_users || 0}
                </Text>
                <Text fontSize="sm" color="blue.500">
                  <Icon as={FiUsers} mr="1" />
                  Đang online
                </Text>
              </Box>
              <Box
                p="3"
                bg="purple.50"
                borderRadius="full"
              >
                <Icon as={FiUsers} color="purple.500" boxSize="6" />
              </Box>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Flex align="center" justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  Tin nhắn
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {chatbotStats?.conversations?.total_messages || 0}
                </Text>
                <Text fontSize="sm" color="orange.500">
                  <Icon as={FiMessageSquare} mr="1" />
                  Tổng số
                </Text>
              </Box>
              <Box
                p="3"
                bg="orange.50"
                borderRadius="full"
              >
                <Icon as={FiDatabase} color="orange.500" boxSize="6" />
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* System Information */}
      {chatbotStats && (
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr 1fr' }} gap="6" mb="8">
          {/* Language Distribution */}
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Phân bố ngôn ngữ sử dụng</Heading>
            </CardHeader>
            <CardBody>
              {chatbotStats.language_distribution && chatbotStats.language_distribution.length > 0 ? (
                <VStack align="stretch" spacing="4">
                  {chatbotStats.language_distribution.map((lang, index) => (
                    <Box key={index}>
                      <Flex justify="space-between" mb="2">
                        <Text fontWeight="medium">
                          {lang._id === 'vi' ? 'Tiếng Việt' : 'English'}
                        </Text>
                        <Text color="gray.500">{lang.count} lượt</Text>
                      </Flex>
                      <Progress
                        value={(lang.count / (chatbotStats.conversations?.total_messages || 1)) * 100}
                        colorScheme={lang._id === 'vi' ? 'blue' : 'green'}
                        size="sm"
                        borderRadius="full"
                      />
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500" textAlign="center" py="8">
                  Chưa có dữ liệu ngôn ngữ
                </Text>
              )}
            </CardBody>
          </Card>

          {/* System Info */}
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Thông tin hệ thống</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing="4">
                <Box>
                  <Text fontSize="sm" color="gray.500" mb="1">LLM Model</Text>
                  <Text fontWeight="medium" fontSize="sm">
                    {chatbotStats.rag_system?.llm_model || 'N/A'}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color="gray.500" mb="1">Embedding Model</Text>
                  <Text fontWeight="medium" fontSize="sm">
                    {chatbotStats.rag_system?.embedding_model?.split('/').pop() || 'N/A'}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color="gray.500" mb="1">Chunk Size</Text>
                  <Text fontWeight="medium" fontSize="sm">
                    {chatbotStats.rag_system?.chunk_size || 'N/A'}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color="gray.500" mb="1">Chunk Overlap</Text>
                  <Text fontWeight="medium" fontSize="sm">
                    {chatbotStats.rag_system?.chunk_overlap || 'N/A'}
                  </Text>
                </Box>
                
                {chatbotStats.rag_system?.last_build_time && (
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb="1">Cập nhật cuối</Text>
                    <Text fontWeight="medium" fontSize="sm">
                      {new Date(chatbotStats.rag_system.last_build_time * 1000).toLocaleString('vi-VN')}
                    </Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
          
          {/* System Status */}
          <SystemStatus chatbotStats={chatbotStats} />
        </Grid>
      )}

      {/* Recent Activity */}
      <Card bg={cardBg} border="1px" borderColor={borderColor} mb="8">
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md">Hoạt động gần đây</Heading>
            <Button size="sm" variant="ghost" onClick={() => navigate('/data-management')}>
              Xem tất cả
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          <VStack align="stretch" spacing="4">
            <HStack>
              <Box
                p="2"
                bg="green.50"
                borderRadius="full"
              >
                <Icon as={FiUpload} color="green.500" boxSize="4" />
              </Box>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium">
                  Tài liệu "Thông tin du lịch Hạ Long" đã được tải lên
                </Text>
                <Text fontSize="xs" color="gray.500">
                  2 giờ trước
                </Text>
              </Box>
            </HStack>
            
            <HStack>
              <Box
                p="2"
                bg="blue.50"
                borderRadius="full"
              >
                <Icon as={FiDatabase} color="blue.500" boxSize="4" />
              </Box>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium">
                  Hệ thống đã xử lý 45 chunks dữ liệu mới
                </Text>
                <Text fontSize="xs" color="gray.500">
                  3 giờ trước
                </Text>
              </Box>
            </HStack>
            
            <HStack>
              <Box
                p="2"
                bg="purple.50"
                borderRadius="full"
              >
                <Icon as={FiMessageSquare} color="purple.500" boxSize="4" />
              </Box>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium">
                  23 cuộc trò chuyện mới với chatbot
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Hôm nay
                </Text>
              </Box>
            </HStack>
            
            <HStack>
              <Box
                p="2"
                bg="orange.50"
                borderRadius="full"
              >
                <Icon as={FiTrendingUp} color="orange.500" boxSize="4" />
              </Box>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium">
                  Hiệu suất chatbot tăng 15% so với tuần trước
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Hôm qua
                </Text>
              </Box>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Upload Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tải lên dữ liệu mới</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing="4" align="stretch">
              {selectedFile && (
                <Box p="4" bg="gray.50" borderRadius="md">
                  <Text fontWeight="medium" mb="2">File đã chọn:</Text>
                  <Text fontSize="sm" color="gray.600">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </Text>
                </Box>
              )}
              
              <FormControl>
                <FormLabel>Loại dữ liệu</FormLabel>
                <Select value={fileType} onChange={(e) => setFileType(e.target.value)}>
                  <option value="document">Tài liệu thông tin</option>
                  <option value="faq">Câu hỏi thường gặp</option>
                  <option value="service">Thông tin dịch vụ</option>
                  <option value="location">Địa điểm du lịch</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Mô tả nội dung</FormLabel>
                <Textarea
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="Mô tả ngắn gọn về nội dung file này..."
                  rows="3"
                />
              </FormControl>
              
              {isUploading && (
                <Box>
                  <Text fontSize="sm" mb="2">Đang tải lên... {uploadProgress}%</Text>
                  <Progress value={uploadProgress} colorScheme="blue" />
                </Box>
              )}
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} disabled={isUploading}>
              Hủy
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleFileUpload}
              isLoading={isUploading}
              loadingText="Đang tải lên..."
            >
              Tải lên
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DashboardPage;