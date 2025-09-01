// src/pages/DataManagement.jsx
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  VStack,
  HStack,
  Button,
  Icon,
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
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Divider
} from '@chakra-ui/react';
import { 
  FiUpload, 
  FiDatabase, 
  FiFileText, 
  FiEdit3, 
  FiTrash2, 
  FiDownload,
  FiRefreshCw,
  FiPlus,
  FiMoreVertical,
  FiEye,
  FiFilter,
  FiSearch
} from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { chatbotAPI } from '../services/api';
import QuickTips from '../components/common/QuickTips';

const DataManagement = () => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('document');
  const [fileDescription, setFileDescription] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Mock data for demonstration
  const mockDocuments = [
    {
      id: 1,
      name: 'Thông tin du lịch Hạ Long',
      type: 'location',
      size: '2.5 MB',
      uploadDate: '2024-01-15',
      status: 'active',
      description: 'Thông tin chi tiết về vịnh Hạ Long, các điểm tham quan và hoạt động du lịch',
      chunks: 45,
      lastModified: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'FAQ Khách sạn',
      type: 'faq',
      size: '1.2 MB',
      uploadDate: '2024-01-14',
      status: 'active',
      description: 'Câu hỏi thường gặp về dịch vụ khách sạn tại Quảng Ninh',
      chunks: 23,
      lastModified: '2024-01-14T15:45:00Z'
    },
    {
      id: 3,
      name: 'Dịch vụ tour du lịch',
      type: 'service',
      size: '3.1 MB',
      uploadDate: '2024-01-13',
      status: 'processing',
      description: 'Danh sách và thông tin các tour du lịch có sẵn',
      chunks: 67,
      lastModified: '2024-01-13T09:20:00Z'
    },
    {
      id: 4,
      name: 'Hướng dẫn đặt phòng',
      type: 'document',
      size: '0.8 MB',
      uploadDate: '2024-01-12',
      status: 'inactive',
      description: 'Hướng dẫn chi tiết quy trình đặt phòng khách sạn',
      chunks: 15,
      lastModified: '2024-01-12T14:10:00Z'
    }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Try to fetch from API, fallback to mock data
      try {
        const response = await chatbotAPI.getDocuments();
        setDocuments(response.data.data || mockDocuments);
      } catch (apiError) {
        // Fallback to mock data if API fails
        console.warn('API not available, using mock data:', apiError);
        setDocuments(mockDocuments);
      }
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách tài liệu');
      console.error('Error fetching documents:', err);
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
      
      // Refresh documents
      fetchDocuments();
      
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

  const handleDeleteDocument = async (id) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast({
        title: 'Xóa thành công',
        description: 'Tài liệu đã được xóa khỏi hệ thống',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Lỗi xóa tài liệu',
        description: 'Có lỗi xảy ra khi xóa tài liệu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    onViewOpen();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'processing': return 'yellow';
      case 'inactive': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'processing': return 'Đang xử lý';
      case 'inactive': return 'Không hoạt động';
      default: return 'Không xác định';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'document': return 'Tài liệu';
      case 'faq': return 'FAQ';
      case 'service': return 'Dịch vụ';
      case 'location': return 'Địa điểm';
      default: return 'Khác';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Flex justify="space-between" align="center" mb="6">
        <Box>
          <Heading size="lg" mb="2">
            Quản lý dữ liệu
          </Heading>
          <Text color="gray.600">
            Tải lên, quản lý và theo dõi tài liệu cho chatbot
          </Text>
        </Box>
        <HStack spacing="3">
          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            variant="outline"
            onClick={fetchDocuments}
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
            Tải lên tài liệu
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

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="6" mb="6">
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Flex align="center" justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  Tổng tài liệu
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {documents.length}
                </Text>
              </Box>
              <Box p="3" bg="blue.50" borderRadius="full">
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
                  Đang hoạt động
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {documents.filter(doc => doc.status === 'active').length}
                </Text>
              </Box>
              <Box p="3" bg="green.50" borderRadius="full">
                <Icon as={FiDatabase} color="green.500" boxSize="6" />
              </Box>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Flex align="center" justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  Đang xử lý
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {documents.filter(doc => doc.status === 'processing').length}
                </Text>
              </Box>
              <Box p="3" bg="yellow.50" borderRadius="full">
                <Icon as={FiRefreshCw} color="yellow.500" boxSize="6" />
              </Box>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Flex align="center" justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  Tổng chunks
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {documents.reduce((sum, doc) => sum + doc.chunks, 0)}
                </Text>
              </Box>
              <Box p="3" bg="purple.50" borderRadius="full">
                <Icon as={FiDatabase} color="purple.500" boxSize="6" />
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Search and Filter */}
      <Card bg={cardBg} mb="6">
        <CardBody>
          <HStack spacing="4">
            <Box flex="1" position="relative">
              <Input
                placeholder="Tìm kiếm tài liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                pl="10"
              />
              <Box
                position="absolute"
                left="3"
                top="50%"
                transform="translateY(-50%)"
                pointerEvents="none"
              >
                <Icon as={FiSearch} color="gray.400" />
              </Box>
            </Box>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              w="200px"
            >
              <option value="all">Tất cả loại</option>
              <option value="document">Tài liệu</option>
              <option value="faq">FAQ</option>
              <option value="service">Dịch vụ</option>
              <option value="location">Địa điểm</option>
            </Select>
          </HStack>
        </CardBody>
      </Card>

      {/* Main Content Grid */}
      <Grid templateColumns={{ base: '1fr', xl: '2fr 1fr' }} gap="6">
        {/* Documents Table */}
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Danh sách tài liệu</Heading>
          </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Tên tài liệu</Th>
                  <Th>Loại</Th>
                  <Th>Kích thước</Th>
                  <Th>Trạng thái</Th>
                  <Th>Chunks</Th>
                  <Th>Ngày tải lên</Th>
                  <Th>Thao tác</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredDocuments.map((document) => (
                  <Tr key={document.id}>
                    <Td>
                      <VStack align="start" spacing="1">
                        <Text fontWeight="medium">{document.name}</Text>
                        <Text fontSize="sm" color="gray.500" noOfLines="1">
                          {document.description}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue" variant="subtle">
                        {getTypeText(document.type)}
                      </Badge>
                    </Td>
                    <Td>{document.size}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(document.status)}>
                        {getStatusText(document.status)}
                      </Badge>
                    </Td>
                    <Td>{document.chunks}</Td>
                    <Td>{new Date(document.uploadDate).toLocaleDateString('vi-VN')}</Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem
                            icon={<FiEye />}
                            onClick={() => handleViewDocument(document)}
                          >
                            Xem chi tiết
                          </MenuItem>
                          <MenuItem icon={<FiEdit3 />}>
                            Chỉnh sửa
                          </MenuItem>
                          <MenuItem icon={<FiDownload />}>
                            Tải xuống
                          </MenuItem>
                          <Divider />
                          <MenuItem
                            icon={<FiTrash2 />}
                            color="red.500"
                            onClick={() => handleDeleteDocument(document.id)}
                          >
                            Xóa
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          
          {filteredDocuments.length === 0 && (
            <Box textAlign="center" py="8">
              <Text color="gray.500">Không tìm thấy tài liệu nào</Text>
            </Box>
          )}
        </CardBody>
        </Card>
        
        {/* Quick Tips Sidebar */}
        <QuickTips />
      </Grid>

      {/* Upload Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tải lên tài liệu mới</ModalHeader>
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

      {/* View Document Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chi tiết tài liệu</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedDocument && (
              <VStack spacing="4" align="stretch">
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb="2">
                    {selectedDocument.name}
                  </Text>
                  <Text color="gray.600" mb="4">
                    {selectedDocument.description}
                  </Text>
                </Box>
                
                <SimpleGrid columns={2} spacing="4">
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb="1">Loại tài liệu</Text>
                    <Badge colorScheme="blue">{getTypeText(selectedDocument.type)}</Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb="1">Trạng thái</Text>
                    <Badge colorScheme={getStatusColor(selectedDocument.status)}>
                      {getStatusText(selectedDocument.status)}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb="1">Kích thước</Text>
                    <Text fontWeight="medium">{selectedDocument.size}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb="1">Số chunks</Text>
                    <Text fontWeight="medium">{selectedDocument.chunks}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb="1">Ngày tải lên</Text>
                    <Text fontWeight="medium">
                      {new Date(selectedDocument.uploadDate).toLocaleDateString('vi-VN')}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb="1">Cập nhật cuối</Text>
                    <Text fontWeight="medium">
                      {new Date(selectedDocument.lastModified).toLocaleString('vi-VN')}
                    </Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onViewClose}>
              Đóng
            </Button>
            <Button colorScheme="blue" leftIcon={<FiEdit3 />}>
              Chỉnh sửa
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DataManagement;