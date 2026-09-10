import type { ServiceDefinition, ServicesByCategory } from '../../types/api';
import React, { memo } from 'react';
import {
  Box,
  HStack,
  VStack,
  IconButton,
  Tooltip,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
  SimpleGrid,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import {
  FaMap,
  FaRoute,
  FaMapMarkerAlt,
  FaCompass,
  FaHotel,
  FaUtensils,
  FaCamera,
  FaShoppingBag,
  FaCar,
  FaPlane,
  FaUmbrella,
  FaInfoCircle
} from 'react-icons/fa';
import ServiceInterfaces from './ServiceInterfaces';
import { SERVICE_CATEGORIES, CATEGORY_LABELS } from '../../constants/serviceData';

interface ServiceToolbarProps {
  servicesByCategory: ServicesByCategory;
  onServiceClick: (serviceKey: string) => void;
  onServiceSelect: (serviceKey: string, suggestion: string) => void;
}

// memo<Props>: khong co type param thi TS suy ra props la `object`, va moi
// component cha truyen prop vao deu bao khong assignable.
const ServiceToolbar = memo<ServiceToolbarProps>(({
  servicesByCategory,
  onServiceClick,
  onServiceSelect
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Icon mapping
  const iconMap = {
    FaMap,
    FaRoute,
    FaMapMarkerAlt,
    FaCompass,
    FaHotel,
    FaUtensils,
    FaCamera,
    FaShoppingBag,
    FaCar,
    FaPlane,
    FaUmbrella,
    FaInfoCircle
  };

  const ServicePopover = ({
    service,
    serviceKey,
    onClick,
    isDetailed = false,
  }: {
    service: ServiceDefinition;
    serviceKey: string;
    onClick: (key: string) => void;
    isDetailed?: boolean;
  }) => {
    const IconComponent = iconMap[service.icon];
    
    return (
      <Popover placement="top" trigger="hover">
        <PopoverTrigger>
          <Box>
            <Tooltip label={service.label}>
              <IconButton
                icon={<IconComponent />}
                size="sm"
                variant="ghost"
                colorScheme={service.color}
                aria-label={service.label}
                onClick={() => onClick(serviceKey)}
                _hover={{ bg: hoverBg }}
                borderRadius="full"
              />
            </Tooltip>
          </Box>
        </PopoverTrigger>
        <PopoverContent w={isDetailed ? "400px" : "280px"} bg={bgColor} border="1px" borderColor={borderColor}>
          <PopoverBody p={isDetailed ? 2 : 4}>
            {isDetailed ? (
              <ServiceInterfaces
                serviceType={serviceKey}
                onSelect={(suggestion) => onServiceSelect?.(serviceKey, suggestion)}
              />
            ) : (
              <VStack spacing={3} align="stretch">
                <HStack>
                  <IconComponent color={`var(--chakra-colors-${service.color}-500)`} />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="bold">{service.label}</Text>
                    <Text fontSize="xs" color="gray.500">{service.description}</Text>
                  </VStack>
                </HStack>
                
                <Divider />
                
                <VStack spacing={2} align="stretch">
                  <Text fontSize="xs" fontWeight="bold" color="gray.600">
                    Gợi ý tìm kiếm:
                  </Text>
                  {service.suggestions?.map((suggestion, index) => (
                    <Button
                      key={index}
                      size="xs"
                      variant="ghost"
                      justifyContent="flex-start"
                      onClick={() => onServiceSelect?.(serviceKey, suggestion)}
                      _hover={{ bg: hoverBg }}
                    >
                      <Text fontSize="xs">{suggestion}</Text>
                    </Button>
                  ))}
                </VStack>
              </VStack>
            )}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Box>
      <VStack spacing={3}>
        {Object.entries(servicesByCategory).map(([categoryKey, services]) => (
          <Box key={categoryKey}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} textAlign="center">
              {CATEGORY_LABELS[categoryKey]}
            </Text>
            
            {categoryKey === SERVICE_CATEGORIES.NAVIGATION ? (
              <HStack spacing={2} justify="center">
                {Object.entries(services).map(([serviceKey, service]) => (
                  <ServicePopover 
                    key={serviceKey}
                    service={service} 
                    serviceKey={serviceKey} 
                    onClick={onServiceClick}
                  />
                ))}
              </HStack>
            ) : categoryKey === SERVICE_CATEGORIES.TOURISM ? (
              <SimpleGrid columns={4} spacing={2}>
                {Object.entries(services).map(([serviceKey, service]) => (
                  <ServicePopover 
                    key={serviceKey}
                    service={service} 
                    serviceKey={serviceKey} 
                    onClick={onServiceClick}
                    isDetailed={true}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <HStack spacing={2} justify="center">
                {Object.entries(services).map(([serviceKey, service]) => {
                  const IconComponent = iconMap[service.icon];
                  return (
                    <Tooltip key={serviceKey} label={service.description}>
                      <IconButton
                        icon={<IconComponent />}
                        size="sm"
                        variant="ghost"
                        colorScheme={service.color}
                        aria-label={service.label}
                        onClick={() => onServiceSelect?.(serviceKey, service.suggestions?.[0])}
                        _hover={{ bg: hoverBg }}
                        borderRadius="full"
                      />
                    </Tooltip>
                  );
                })}
              </HStack>
            )}
            
            {categoryKey !== SERVICE_CATEGORIES.UTILITY && <Divider />}
          </Box>
        ))}
      </VStack>
    </Box>
  );
});

export default ServiceToolbar;