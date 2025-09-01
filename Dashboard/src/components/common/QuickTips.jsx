// src/components/common/QuickTips.jsx
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { 
  FiUpload, 
  FiFileText, 
  FiDatabase, 
  FiCheckCircle,
  FiInfo,
  FiAlertCircle
} from 'react-icons/fi';

const QuickTips = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const tips = [
    {
      title: 'Tải lên tài liệu hiệu quả',
      icon: FiUpload,
      color: 'blue',
      items: [
        'Hỗ trợ file: PDF, TXT, CSV, JSON (tối đa 10MB)',
        'Đặt tên file rõ ràng, dễ hiểu',
        'Thêm mô tả chi tiết để dễ quản lý',
        'Chọn đúng loại dữ liệu khi upload'
      ]
    },
    {
      title: 'Quản lý dữ liệu tốt nhất',
      icon: FiDatabase,
      color: 'green',
      items: [
        'Thường xuyên kiểm tra trạng thái tài liệu',
        'Xóa các file không cần thiết để tiết kiệm dung lượng',
        'Sử dụng tính năng tìm kiếm để nhanh chóng tìm file',
        'Backup dữ liệu quan trọng định kỳ'
      ]
    },
    {
      title: 'Tối ưu hiệu suất chatbot',
      icon: FiFileText,
      color: 'purple',
      items: [
        'Cung cấp dữ liệu chất lượng cao, đầy đủ thông tin',
        'Tránh upload file trùng lặp nội dung',
        'Cập nhật thông tin thường xuyên',
        'Theo dõi số lượng chunks được tạo'
      ]
    }
  ];

  return (
    <Card bg={cardBg} border="1px" borderColor={borderColor}>
      <CardHeader>
        <HStack>
          <Icon as={FiInfo} color="blue.500" />
          <Heading size="md">Mẹo sử dụng</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <Accordion allowMultiple>
          {tips.map((tip, index) => (
            <AccordionItem key={index} border="none">
              <AccordionButton px="0" py="3">
                <HStack flex="1" textAlign="left">
                  <Box
                    p="2"
                    bg={`${tip.color}.50`}
                    borderRadius="md"
                  >
                    <Icon as={tip.icon} color={`${tip.color}.500`} boxSize="4" />
                  </Box>
                  <Text fontWeight="medium">{tip.title}</Text>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel px="0" pb="4">
                <List spacing="2" ml="12">
                  {tip.items.map((item, itemIndex) => (
                    <ListItem key={itemIndex} fontSize="sm" color="gray.600">
                      <ListIcon as={FiCheckCircle} color="green.500" />
                      {item}
                    </ListItem>
                  ))}
                </List>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
        
        <Box mt="6" p="4" bg="yellow.50" borderRadius="md" border="1px" borderColor="yellow.200">
          <HStack mb="2">
            <Icon as={FiAlertCircle} color="yellow.600" />
            <Text fontWeight="semibold" color="yellow.800">Lưu ý quan trọng</Text>
          </HStack>
          <Text fontSize="sm" color="yellow.700">
            Sau khi tải lên tài liệu mới, hệ thống cần thời gian để xử lý và tạo chunks. 
            Chatbot sẽ có thể sử dụng thông tin mới sau khi quá trình này hoàn tất.
          </Text>
        </Box>
      </CardBody>
    </Card>
  );
};

export default QuickTips;