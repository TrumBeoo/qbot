import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  Button,
  Divider,
  SimpleGrid,
  useColorModeValue,
  Link,
  Wrap,
  WrapItem,
  IconButton
} from '@chakra-ui/react';
import {
  FaStar,
  FaPhone,
  FaGlobe,
  FaClock,
  FaDollarSign,
  FaMapMarkerAlt,
  FaDirections,
  FaExternalLinkAlt,
  FaArrowLeft
} from 'react-icons/fa';

const PlaceDetails = ({ place, onGetDirections, onClose }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!place) return null;

  const formatPriceLevel = (level) => {
    if (!level) return null;
    return '$'.repeat(level);
  };

  const getPlaceTypeLabel = (types) => {
    if (!types || !Array.isArray(types)) return [];
    
    const typeLabels = {
      restaurant: 'Nhà hàng',
      lodging: 'Khách sạn',
      tourist_attraction: 'Điểm du lịch',
      gas_station: 'Cây xăng',
      hospital: 'Bệnh viện',
      bank: 'Ngân hàng',
      shopping_mall: 'Trung tâm mua sắm',
      food: 'Ăn uống',
      store: 'Cửa hàng',
      travel_agency: 'Đại lý du lịch',
      amusement_park: 'Công viên giải trí',
      museum: 'Bảo tàng',
      park: 'Công viên',
      temple: 'Chùa',
      church: 'Nhà thờ',
      school: 'Trường học',
      gym: 'Phòng tập',
      spa: 'Spa',
      pharmacy: 'Nhà thuốc',
      supermarket: 'Siêu thị'
    };

    return types
      .map(type => typeLabels[type] || type.replace(/_/g, ' '))
      .filter(Boolean)
      .slice(0, 3);
  };

  return (
    <Box h="100%">
      <VStack spacing={0} align="stretch" h="100%">
        {/* Header */}
        <Box p={4} bg={bgColor} borderBottom="1px" borderColor={borderColor}>
          <HStack spacing={2} mb={3}>
            <IconButton
              icon={<FaArrowLeft />}
              size="sm"
              variant="ghost"
              onClick={onClose}
              aria-label="Quay lại"
            />
            <Text fontSize="md" fontWeight="bold">Chi tiết địa điểm</Text>
          </HStack>
        </Box>

        {/* Content */}
        <Box flex={1} overflowY="auto" p={4}>
          <VStack spacing={4} align="stretch">
            {/* Place Name & Rating */}
            <VStack spacing={2} align="start">
              <Text fontSize="lg" fontWeight="bold" lineHeight="short">
                {place.name}
              </Text>
              
              <HStack spacing={3}>
                {place.rating && (
                  <HStack spacing={1}>
                    <FaStar color="gold" size="14px" />
                    <Text fontWeight="bold">{place.rating}</Text>
                    {place.user_ratings_total && (
                      <Text fontSize="sm" color="gray.600">
                        ({place.user_ratings_total})
                      </Text>
                    )}
                  </HStack>
                )}
                
                {place.price_level && (
                  <HStack spacing={1}>
                    <FaDollarSign color="green" size="12px" />
                    <Text color="green.500" fontWeight="bold">
                      {formatPriceLevel(place.price_level)}
                    </Text>
                  </HStack>
                )}
              </HStack>

              {/* Types */}
              {place.types && place.types.length > 0 && (
                <Wrap>
                  {getPlaceTypeLabel(place.types).map((type, index) => (
                    <WrapItem key={index}>
                      <Badge colorScheme="blue" size="sm">
                        {type}
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              )}
            </VStack>

            <Divider />

            {/* Address */}
            <HStack align="start" spacing={3}>
              <FaMapMarkerAlt color="red" size="16px" />
              <Text fontSize="sm" color="gray.600">
                {place.formatted_address}
              </Text>
            </HStack>

            {/* Contact Info */}
            {(place.formatted_phone_number || place.website) && (
              <>
                <Divider />
                <VStack spacing={3} align="stretch">
                  {place.formatted_phone_number && (
                    <HStack spacing={3}>
                      <FaPhone color="blue" size="14px" />
                      <Link href={`tel:${place.formatted_phone_number}`} fontSize="sm">
                        {place.formatted_phone_number}
                      </Link>
                    </HStack>
                  )}
                  
                  {place.website && (
                    <HStack spacing={3}>
                      <FaGlobe color="green" size="14px" />
                      <Link 
                        href={place.website} 
                        isExternal 
                        fontSize="sm"
                        color="blue.500"
                      >
                        Website <FaExternalLinkAlt size="10px" />
                      </Link>
                    </HStack>
                  )}
                </VStack>
              </>
            )}

            {/* Opening Hours */}
            {place.opening_hours && (
              <>
                <Divider />
                <VStack spacing={2} align="stretch">
                  <HStack spacing={3}>
                    <FaClock color="orange" size="14px" />
                    <Text fontSize="sm" fontWeight="bold">Giờ mở cửa</Text>
                  </HStack>
                  
                  {place.opening_hours.open_now !== undefined && (
                    <Badge 
                      colorScheme={place.opening_hours.open_now ? 'green' : 'red'}
                      size="sm"
                      w="fit-content"
                    >
                      {place.opening_hours.open_now ? 'Đang mở cửa' : 'Đã đóng cửa'}
                    </Badge>
                  )}
                  
                  {place.opening_hours.weekday_text && (
                    <VStack spacing={1} align="stretch">
                      {place.opening_hours.weekday_text.slice(0, 3).map((hours, index) => (
                        <Text key={index} fontSize="xs" color="gray.600">
                          {hours}
                        </Text>
                      ))}
                      {place.opening_hours.weekday_text.length > 3 && (
                        <Text fontSize="xs" color="blue.500" cursor="pointer">
                          Xem thêm...
                        </Text>
                      )}
                    </VStack>
                  )}
                </VStack>
              </>
            )}

            {/* Photos */}
            {place.photos && place.photos.length > 0 && (
              <>
                <Divider />
                <VStack spacing={3} align="stretch">
                  <Text fontSize="sm" fontWeight="bold">Hình ảnh</Text>
                  <SimpleGrid columns={2} spacing={2}>
                    {place.photos.slice(0, 4).map((photo, index) => (
                      <Image
                        key={index}
                        src={photo.getUrl ? photo.getUrl({ maxWidth: 200 }) : photo}
                        alt={`${place.name} - ${index + 1}`}
                        borderRadius="md"
                        objectFit="cover"
                        h="80px"
                        w="100%"
                        cursor="pointer"
                        _hover={{ opacity: 0.8 }}
                      />
                    ))}
                  </SimpleGrid>
                </VStack>
              </>
            )}
          </VStack>
        </Box>

        {/* Action Buttons */}
        <Box p={4} bg={bgColor} borderTop="1px" borderColor={borderColor}>
          <Button
            leftIcon={<FaDirections />}
            onClick={onGetDirections}
            colorScheme="blue"
            w="100%"
            size="md"
          >
            Chỉ đường
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default PlaceDetails;