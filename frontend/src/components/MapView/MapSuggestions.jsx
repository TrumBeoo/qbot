// src/components/MapView/MapSuggestions.jsx
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Wrap,
  WrapItem,
  Badge,
  IconButton,
  CloseButton
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaRoute, FaCompass, FaSearch, FaTimes, FaHotel, FaUtensils, FaCamera } from 'react-icons/fa';
import { mapService } from '../../services/mapService';

const MapSuggestions = ({ onSuggestionClick, onClose }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Gợi ý tập trung vào du lịch Quảng Ninh
  const quangNinhSuggestions = [
    'Vịnh Hạ Long Quảng Ninh',
    'Chùa Yên Tử Quảng Ninh',
    'Bãi Cháy Hạ Long',
    'Nhà hàng hải sản Hạ Long',
    'Khách sạn view vịnh Hạ Long',
    'Tour du thuyền Hạ Long',
    'Cáp treo Yên Tử'
  ];

  // Điểm đến du lịch nổi tiếng Quảng Ninh
  const quangNinhDestinations = [
    {
      name: 'Vịnh Hạ Long',
      location: 'Hạ Long, Quảng Ninh',
      description: 'Di sản thiên nhiên thế giới UNESCO',
      type: 'nature',
      icon: FaCamera
    },
    {
      name: 'Chùa Yên Tử',
      location: 'Uông Bí, Quảng Ninh',
      description: 'Phật giáo Trúc Lâm Yên Tử',
      type: 'culture',
      icon: FaCompass
    },
    {
      name: 'Bãi Cháy',
      location: 'Hạ Long, Quảng Ninh',
      description: 'Bãi biển và khu vui chơi giải trí',
      type: 'beach',
      icon: FaMapMarkerAlt
    },
    {
      name: 'Cửa Ông',
      location: 'Cẩm Phả, Quảng Ninh',
      description: 'Cảng biển và khu du lịch',
      type: 'port',
      icon: FaRoute
    }
  ];

  // Dịch vụ du lịch Quảng Ninh
  const tourismServices = [
    {
      name: 'Khách sạn Hạ Long',
      query: 'Khách sạn tốt nhất Hạ Long Quảng Ninh',
      icon: FaHotel,
      color: 'blue'
    },
    {
      name: 'Nhà hàng hải sản',
      query: 'Nhà hàng hải sản ngon Hạ Long',
      icon: FaUtensils,
      color: 'orange'
    },
    {
      name: 'Tour du thuyền',
      query: 'Tour du thuyền vịnh Hạ Long',
      icon: FaRoute,
      color: 'teal'
    },
    {
      name: 'Điểm chụp ảnh',
      query: 'Địa điểm chụp ảnh đẹp Quảng Ninh',
      icon: FaCamera,
      color: 'purple'
    }
  ];

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion);
    onClose();
  };

  const handleDestinationClick = (destination) => {
    const query = `Hiển thị bản đồ ${destination.name}, ${destination.location}`;
    onSuggestionClick(query);
    onClose();
  };

  const handleServiceClick = (service) => {
    onSuggestionClick(service.query);
    onClose();
  };

  return (
    <Box
      position="absolute"
      bottom="100%"
      left={0}
      right={0}
      mb={2}
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow="lg"
      p={4}
      maxH="300px"
      overflowY="auto"
      zIndex={1000}
    >
      {/* Header với nút đóng */}
      <HStack justify="space-between">
        <HStack>
        </HStack>
        <CloseButton
          size="md"
          onClick={onClose}
          _hover={{ bg: hoverBg }}
        />
      </HStack>

      <VStack spacing={4} align="stretch">
        {/* Quick Suggestions - Địa điểm Quảng Ninh */}
        <Box>
          <HStack mb={3}>
            <FaSearch size={14} color="blue" />
            <Text fontSize="sm" fontWeight="bold">
              Địa điểm nổi tiếng
            </Text>
          </HStack>
          <Wrap spacing={2}>
            {quangNinhSuggestions.map((suggestion, index) => (
              <WrapItem key={index}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSuggestionClick(suggestion)}
                  _hover={{ bg: hoverBg }}
                  fontSize="xs"
                  colorScheme="blue"
                >
                  {suggestion}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        </Box>

        {/* Điểm đến du lịch Quảng Ninh */}
        <Box>
          <HStack mb={3}>
            <FaMapMarkerAlt size={14} color="green" />
            <Text fontSize="sm" fontWeight="bold">
              Gợi ý điểm đến
            </Text>
          </HStack>
          <VStack spacing={2} align="stretch">
            {quangNinhDestinations.map((destination, index) => {
              const IconComponent = destination.icon;
              return (
                <Box
                  key={index}
                  p={3}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleDestinationClick(destination)}
                  border="1px"
                  borderColor="transparent"
                 
                >
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <IconComponent size={16} color="green" />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {destination.name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {destination.description}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge colorScheme="green" fontSize="xs">
                      {destination.location.split(',')[0]}
                    </Badge>
                  </HStack>
                </Box>
              );
            })}
          </VStack>
        </Box>

        {/* Dịch vụ du lịch */}
        <Box>
          <HStack mb={3}>
            <FaCompass size={14} color="purple" />
            <Text fontSize="sm" fontWeight="bold">
              Dịch vụ du lịch
            </Text>
          </HStack>
          <VStack spacing={2} align="stretch">
            {tourismServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Button
                  key={index}
                  leftIcon={<IconComponent />}
                  onClick={() => handleServiceClick(service)}
                  colorScheme={service.color}
                  variant="outline"
                  size="sm"
                  justifyContent="flex-start"
                  _hover={{ bg: hoverBg }}
                >
                  {service.name}
                </Button>
              );
            })}
          </VStack>
        </Box>

        {/* Hành động nhanh */}
        <Box>
          <HStack mb={3}>
            <FaRoute size={14} color="orange" />
            <Text fontSize="sm" fontWeight="bold">
              Hành động nhanh
            </Text>
          </HStack>
          <HStack spacing={2} wrap="wrap">
            <Button
              size="sm"
              leftIcon={<FaMapMarkerAlt />}
              onClick={() => handleSuggestionClick('Vị trí hiện tại của tôi')}
              colorScheme="orange"
              variant="outline"
            >
              Vị trí của tôi
            </Button>
            <Button
              size="sm"
              leftIcon={<FaRoute />}
              onClick={() => handleSuggestionClick('Chỉ đường từ Hà Nội đến Hạ Long')}
              colorScheme="orange"
              variant="outline"
            >
              Đến Hạ Long
            </Button>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default MapSuggestions;