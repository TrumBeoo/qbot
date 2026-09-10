import React, { memo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Divider
} from '@chakra-ui/react';
import {
  FaHotel,
  FaUtensils,
  FaCamera,
  FaShoppingBag,
  FaCar,
  FaUmbrella,
  FaInfoCircle,
  FaPlane,
  FaStar,
  FaClock,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { DETAILED_SERVICE_DATA, QUICK_ACTIONS, QUICK_ACTION_LABELS } from '../../constants/serviceData';

interface ServiceInterfacesProps {
  serviceType: string;
  onSelect: (suggestion: string) => void;
}

const ServiceInterfaces = memo<ServiceInterfacesProps>(({ serviceType, onSelect }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Icon mapping
  const iconMap = {
    FaHotel,
    FaUtensils,
    FaCamera,
    FaShoppingBag,
    FaCar,
    FaUmbrella,
    FaInfoCircle,
    FaPlane
  };

  const service = DETAILED_SERVICE_DATA[serviceType];
  if (!service) return null;

  const IconComponent = iconMap[service.icon];

  return (
    <Box maxW="400px" bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={4}>
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack spacing={3}>
          <Icon as={IconComponent} color={`${service.color}.500`} boxSize={6} />
          <VStack align="start" spacing={0}>
            <Text fontSize="md" fontWeight="bold">{service.title}</Text>
            <Badge colorScheme={service.color} size="sm">Quảng Ninh</Badge>
          </VStack>
        </HStack>

        <Divider />

        {/* Categories */}
        <VStack spacing={3} align="stretch">
          {service.categories.map((category, index) => (
            <Box key={index}>
              <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
                {category.name}
              </Text>
              <SimpleGrid columns={1} spacing={1}>
                {category.items.map((item, itemIndex) => (
                  <Button
                    key={itemIndex}
                    size="sm"
                    variant="ghost"
                    justifyContent="flex-start"
                    onClick={() => onSelect?.(item)}
                    _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                    leftIcon={<FaMapMarkerAlt size="12px" />}
                  >
                    <Text fontSize="sm" noOfLines={1}>{item}</Text>
                  </Button>
                ))}
              </SimpleGrid>
            </Box>
          ))}
        </VStack>

        {/* Quick Actions */}
        <Divider />
        <HStack spacing={2}>
          <Button
            size="xs"
            colorScheme={service.color}
            variant="outline"
            leftIcon={<FaStar size="10px" />}
            onClick={() => onSelect?.(`${QUICK_ACTION_LABELS[QUICK_ACTIONS.TOP_RATED]} ${service.title.toLowerCase()}`)}
          >
            {QUICK_ACTION_LABELS[QUICK_ACTIONS.TOP_RATED]}
          </Button>
          <Button
            size="xs"
            colorScheme={service.color}
            variant="outline"
            leftIcon={<FaMapMarkerAlt size="10px" />}
            onClick={() => onSelect?.(`${service.title} ${QUICK_ACTION_LABELS[QUICK_ACTIONS.NEAREST].toLowerCase()}`)}
          >
            {QUICK_ACTION_LABELS[QUICK_ACTIONS.NEAREST]}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
});

export default ServiceInterfaces;