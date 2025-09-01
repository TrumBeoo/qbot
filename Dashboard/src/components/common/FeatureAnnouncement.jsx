// src/components/common/FeatureAnnouncement.jsx
import {
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
  Collapse,
  useDisclosure,
  Button,
  Icon
} from '@chakra-ui/react';
import { FiUpload, FiDatabase, FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';

const FeatureAnnouncement = () => {
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });
  const [isVisible, setIsVisible] = useState(true);
  const bg = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('blue.200', 'blue.700');

  useEffect(() => {
    // Check if user has already dismissed this announcement
    const dismissed = localStorage.getItem('feature-announcement-dismissed');
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('feature-announcement-dismissed', 'true');
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <Collapse in={isOpen} animateOpacity>
      <Box mb="6">
        <Alert
          status="info"
          variant="subtle"
          bg={bg}
          border="1px"
          borderColor={borderColor}
          borderRadius="md"
          p="4"
        >
          <AlertIcon />
          <Box flex="1">
            <AlertTitle fontSize="lg" mb="2">
              🎉 Cập nhật mới: Giao diện Dashboard được cải tiến!
            </AlertTitle>
            <AlertDescription>
              <VStack align="start" spacing="3">
                <Text>
                  Chúng tôi đã nâng cấp Dashboard với những tính năng mới để cải thiện trải nghiệm của bạn:
                </Text>
                
                <VStack align="start" spacing="2" pl="4">
                  <HStack>
                    <Icon as={FiUpload} color="blue.500" />
                    <Text fontSize="sm">
                      <strong>Tải lên dữ liệu dễ dàng:</strong> Hỗ trợ upload file PDF, TXT, CSV, JSON
                    </Text>
                  </HStack>
                  
                  <HStack>
                    <Icon as={FiDatabase} color="green.500" />
                    <Text fontSize="sm">
                      <strong>Quản lý dữ liệu tập trung:</strong> Xem, chỉnh sửa và quản lý tất cả tài liệu
                    </Text>
                  </HStack>
                  
                  <HStack>
                    <Badge colorScheme="red" variant="subtle">Đã bỏ</Badge>
                    <Text fontSize="sm">
                      Chat widget đã được loại bỏ để tập trung vào quản lý dữ liệu
                    </Text>
                  </HStack>
                </VStack>
                
                <Text fontSize="sm" color="gray.600" mt="2">
                  Khám phá trang <strong>"Quản lý dữ liệu"</strong> trong menu để trải nghiệm các tính năng mới!
                </Text>
              </VStack>
            </AlertDescription>
          </Box>
          
          <CloseButton
            alignSelf="flex-start"
            position="relative"
            right={-1}
            top={-1}
            onClick={handleDismiss}
          />
        </Alert>
      </Box>
    </Collapse>
  );
};

export default FeatureAnnouncement;