// src/components/common/SystemStatus.jsx
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
  Progress,
  Divider,
  Flex
} from '@chakra-ui/react';
import { 
  FiServer, 
  FiDatabase, 
  FiCpu, 
  FiHardDrive,
  FiWifi,
  FiCheckCircle,
  FiAlertTriangle
} from 'react-icons/fi';

const SystemStatus = ({ chatbotStats }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const systemMetrics = [
    {
      label: 'API Server',
      status: 'online',
      icon: FiServer,
      value: '99.9%',
      description: 'Uptime'
    },
    {
      label: 'Database',
      status: 'online',
      icon: FiDatabase,
      value: '< 50ms',
      description: 'Response time'
    },
    {
      label: 'Vector Store',
      status: 'online',
      icon: FiCpu,
      value: chatbotStats?.rag_system?.document_count || 0,
      description: 'Documents indexed'
    },
    {
      label: 'Storage',
      status: 'warning',
      icon: FiHardDrive,
      value: '78%',
      description: 'Used'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'green';
      case 'warning': return 'yellow';
      case 'offline': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return FiCheckCircle;
      case 'warning': return FiAlertTriangle;
      case 'offline': return FiAlertTriangle;
      default: return FiServer;
    }
  };

  return (
    <Card bg={cardBg} border="1px" borderColor={borderColor}>
      <CardHeader>
        <HStack>
          <Icon as={FiWifi} color="green.500" />
          <Heading size="md">Trạng thái hệ thống</Heading>
          <Badge colorScheme="green" variant="subtle">
            Hoạt động tốt
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack align="stretch" spacing="4">
          {systemMetrics.map((metric, index) => (
            <Box key={index}>
              <Flex justify="space-between" align="center" mb="2">
                <HStack>
                  <Icon as={metric.icon} color="gray.500" boxSize="4" />
                  <Text fontSize="sm" fontWeight="medium">
                    {metric.label}
                  </Text>
                </HStack>
                <HStack>
                  <Text fontSize="sm" fontWeight="bold">
                    {metric.value}
                  </Text>
                  <Icon 
                    as={getStatusIcon(metric.status)} 
                    color={`${getStatusColor(metric.status)}.500`}
                    boxSize="4"
                  />
                </HStack>
              </Flex>
              <Text fontSize="xs" color="gray.500" mb="2">
                {metric.description}
              </Text>
              {metric.status === 'warning' && metric.label === 'Storage' && (
                <Progress value={78} colorScheme="yellow" size="sm" borderRadius="full" />
              )}
              {index < systemMetrics.length - 1 && <Divider mt="3" />}
            </Box>
          ))}
        </VStack>
        
        <Divider my="4" />
        
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb="2">
            Thông tin phiên bản
          </Text>
          <VStack align="stretch" spacing="1">
            <Flex justify="space-between">
              <Text fontSize="xs" color="gray.500">Dashboard</Text>
              <Text fontSize="xs" fontWeight="medium">v2.1.0</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontSize="xs" color="gray.500">API Backend</Text>
              <Text fontSize="xs" fontWeight="medium">v1.5.2</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontSize="xs" color="gray.500">Last Update</Text>
              <Text fontSize="xs" fontWeight="medium">
                {new Date().toLocaleDateString('vi-VN')}
              </Text>
            </Flex>
          </VStack>
        </Box>
      </CardBody>
    </Card>
  );
};

export default SystemStatus;