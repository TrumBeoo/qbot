// src/components/MapView/InlineMap.jsx
import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  HStack,
  Text,
  useColorModeValue,
  Spinner,
  Center
} from '@chakra-ui/react';
import { FaExpand, FaMapMarkerAlt } from 'react-icons/fa';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const libraries = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '200px',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: 21.0285, // Hà Nội
  lng: 105.8542
};

const InlineMap = ({ location, onExpand, title = "Bản đồ" }) => {
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    setIsLoaded(true);
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Box 
        p={4} 
        bg={bgColor} 
        border="1px" 
        borderColor={borderColor} 
        borderRadius="md"
      >
        <Text color="red.500" fontSize="sm">
          Google Maps API key chưa được cấu hình
        </Text>
      </Box>
    );
  }

  return (
    <Box 
      bg={bgColor} 
      border="1px" 
      borderColor={borderColor} 
      borderRadius="md" 
      overflow="hidden"
      maxW="400px"
    >
      <HStack justify="space-between" p={3} borderBottom="1px" borderColor={borderColor}>
        <HStack>
          <FaMapMarkerAlt color="red" />
          <Text fontSize="sm" fontWeight="bold">{title}</Text>
        </HStack>
        <Button
          size="xs"
          leftIcon={<FaExpand />}
          onClick={onExpand}
          variant="outline"
        >
          Mở rộng
        </Button>
      </HStack>
      
      <Box position="relative">
        <LoadScript
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          libraries={libraries}
          loadingElement={
            <Center h="200px">
              <Spinner size="md" />
            </Center>
          }
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={location || defaultCenter}
            zoom={location ? 15 : 10}
            onLoad={onMapLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: 'cooperative'
            }}
          >
            {location && (
              <Marker
                position={location}
                title={title}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </Box>
    </Box>
  );
};

export default InlineMap;