// src/pages/ChatbotManagement.jsx
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  VStack,
  HStack,
  Button,
  Text,
  Input,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spinner,
  Alert,
  AlertIcon,
  Select,
  FormControl,
  FormLabel,
  useColorModeValue
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { EditIcon, DeleteIcon, AddIcon, RepeatIcon } from '@chakra-ui/icons';
import { chatbotAPI } from '../services/api';

const ChatbotManagement = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Data sources state
  const [dataSources, setDataSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  
  // Modal states
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // Form states
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [editingFile, setEditingFile] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deletingFile, setDeletingFile] = useState(null);
  
  // Chatbot test state
  const [testQuery, setTestQuery] = useState('');
  const [testLanguage, setTestLanguage] = useState('vi');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  
  // Loading states
  const [rebuildLoading, setRebuildLoading] = useState(false);
  
  const cancelRef = useRef();

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      setLoadingSources(true);
      const response = await chatbotAPI.getDataSources();
      setDataSources(response.data.data);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách tài liệu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingSources(false);
    }
  };

  const handleAddFile = async () => {
    if (!newFileName.trim() || !newFileContent.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên file và nội dung',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await chatbotAPI.addDataSource(newFileName, newFileContent);
      toast({
        title: 'Thành công',
        description: 'Đã thêm tài liệu mới',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNewFileName('');
      setNewFileContent('');
      onAddClose();
      fetchDataSources();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể thêm tài liệu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditFile = async (filename) => {
    try {
      const response = await chatbotAPI.getFileContent(filename);
      setEditingFile(filename);
      setEditContent(response.data.data.content);
      onEditOpen();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải nội dung file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateFile = async () => {
    if (!editContent.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Nội dung không được để trống',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await chatbotAPI.updateDataSource(editingFile, editContent);
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật tài liệu',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onEditClose();
      fetchDataSources();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể cập nhật tài liệu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteFile = async () => {
    try {
      await chatbotAPI.deleteDataSource(deletingFile);
      toast({
        title: 'Thành công',
        description: 'Đã xóa tài liệu',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      fetchDataSources();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xóa tài liệu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTestChatbot = async () => {
    if (!testQuery.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập câu hỏi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setTestLoading(true);
      const response = await chatbotAPI.testChatbot(testQuery, testLanguage);
      setTestResult(response.data.data);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể test chatbot',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleRebuildVectorstore = async () => {
    try {
      setRebuildLoading(true);
      await chatbotAPI.rebuildVectorstore();
      toast({
        title: 'Thành công',
        description: 'Đã rebuild vector store thành công',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể rebuild vector store',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setRebuildLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Heading size="lg" mb="6">
        Quản lý Chatbot Du lịch
      </Heading>

      <Tabs>
        <TabList>
          <Tab>Quản lý dữ liệu</Tab>
          <Tab>Test Chatbot</Tab>
          <Tab>Cài đặt hệ thống</Tab>
        </TabList>

        <TabPanels>
          {/* Data Management Tab */}
          <TabPanel>
            <VStack spacing="6" align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Tài liệu dữ liệu</Heading>
                <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onAddOpen}>
                  Thêm tài liệu
                </Button>
              </HStack>

              <Card bg={cardBg}>
                <CardBody>
                  {loadingSources ? (
                    <Box display="flex" justifyContent="center" p="4">
                      <Spinner />
                    </Box>
                  ) : (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Tên file</Th>
                          <Th>Kích thước</Th>
                          <Th>Loại file</Th>
                          <Th>Cập nhật</Th>
                          <Th>Thao tác</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {dataSources.map((file, index) => (
                          <Tr key={index}>
                            <Td>{file.filename}</Td>
                            <Td>{formatFileSize(file.size)}</Td>
                            <Td>
                              <Badge colorScheme="gray">
                                {file.extension || 'txt'}
                              </Badge>
                            </Td>
                            <Td>{new Date(file.modified).toLocaleString('vi-VN')}</Td>
                            <Td>
                              <HStack spacing="2">
                                <IconButton
                                  icon={<EditIcon />}
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handleEditFile(file.filename)}
                                />
                                <IconButton
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => {
                                    setDeletingFile(file.filename);
                                    onDeleteOpen();
                                  }}
                                />
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Chatbot Test Tab */}
          <TabPanel>
            <VStack spacing="6" align="stretch">
              <Heading size="md">Test Chatbot</Heading>
              
              <Card bg={cardBg}>
                <CardBody>
                  <VStack spacing="4" align="stretch">
                    <FormControl>
                      <FormLabel>Ngôn ngữ</FormLabel>
                      <Select value={testLanguage} onChange={(e) => setTestLanguage(e.target.value)}>
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Câu hỏi</FormLabel>
                      <Textarea
                        value={testQuery}
                        onChange={(e) => setTestQuery(e.target.value)}
                        placeholder="Nhập câu hỏi để test chatbot..."
                        rows="3"
                      />
                    </FormControl>
                    
                    <Button
                      colorScheme="green"
                      onClick={handleTestChatbot}
                      isLoading={testLoading}
                      loadingText="Đang xử lý..."
                    >
                      Test Chatbot
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {testResult && (
                <Card bg={cardBg}>
                  <CardBody>
                    <VStack spacing="4" align="stretch">
                      <Heading size="sm">Kết quả:</Heading>
                      
                      <Box p="4" bg="gray.50" borderRadius="md">
                        <Text><strong>Câu hỏi:</strong> {testResult.query}</Text>
                        <Text><strong>Ngôn ngữ:</strong> {testResult.language}</Text>
                      </Box>
                      
                      <Box p="4" bg="blue.50" borderRadius="md">
                        <Text><strong>Trả lời:</strong></Text>
                        <Text mt="2">{testResult.response?.answer || testResult.response}</Text>
                      </Box>
                      
                      {testResult.response?.sources && (
                        <Box p="4" bg="green.50" borderRadius="md">
                          <Text><strong>Nguồn tham khảo:</strong></Text>
                          {testResult.response.sources.map((source, index) => (
                            <Box key={index} mt="2" p="2" bg="white" borderRadius="sm">
                              <Text fontSize="sm"><strong>File:</strong> {source.source}</Text>
                              <Text fontSize="sm" color="gray.600">{source.content}</Text>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>

          {/* System Settings Tab */}
          <TabPanel>
            <VStack spacing="6" align="stretch">
              <Heading size="md">Cài đặt hệ thống</Heading>
              
              <Card bg={cardBg}>
                <CardBody>
                  <VStack spacing="4" align="stretch">
                    <Text>Rebuild Vector Store sẽ tái tạo lại toàn bộ cơ sở dữ liệu vector từ các tài liệu hiện có.</Text>
                    <Alert status="warning">
                      <AlertIcon />
                      Quá trình này có thể mất vài phút và chatbot sẽ tạm thời không hoạt động.
                    </Alert>
                    <Button
                      leftIcon={<RepeatIcon />}
                      colorScheme="orange"
                      onClick={handleRebuildVectorstore}
                      isLoading={rebuildLoading}
                      loadingText="Đang rebuild..."
                    >
                      Rebuild Vector Store
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Add File Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Thêm tài liệu mới</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing="4">
              <FormControl>
                <FormLabel>Tên file</FormLabel>
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Ví dụ: halong_bay.txt"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Nội dung</FormLabel>
                <Textarea
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Nhập nội dung tài liệu..."
                  rows="10"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddClose}>
              Hủy
            </Button>
            <Button colorScheme="blue" onClick={handleAddFile}>
              Thêm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit File Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chỉnh sửa: {editingFile}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Nội dung</FormLabel>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows="15"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Hủy
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateFile}>
              Cập nhật
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Xóa tài liệu
            </AlertDialogHeader>
            <AlertDialogBody>
              Bạn có chắc chắn muốn xóa file "{deletingFile}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Hủy
              </Button>
              <Button colorScheme="red" onClick={handleDeleteFile} ml={3}>
                Xóa
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ChatbotManagement;