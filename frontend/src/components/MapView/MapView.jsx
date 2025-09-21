import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useColorModeValue,
  IconButton,
  Tooltip,
  Badge,
  useToast,
  Spinner,
  Center,
  InputGroup,
  InputLeftElement,
  Flex,
  Divider
} from '@chakra-ui/react';
import { 
  FaSearch, 
  FaLocationArrow,
  FaTimes,
  FaRoute,
  FaMapMarkerAlt,
  FaCompass,
  FaExpand
} from 'react-icons/fa';
import googleMapsService from '../../services/googleMapsService';
import PlaceDetails from './PlaceDetails';
import SearchSuggestions from './SearchSuggestions';

const MapView = ({ isOpen, onClose, initialQuery = '' }) => {
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [markers, setMarkers] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const mapRef = useRef(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');

  useEffect(() => {
    if (isOpen) {
      initializeMap();
      if (initialQuery) {
        setSearchQuery(initialQuery);
        setTimeout(() => handleSearch(initialQuery), 1000);
      }
    }
  }, [isOpen, initialQuery]);

  const initializeMap = async () => {
    try {
      setIsLoading(true);
      await googleMapsService.initialize();
      
      if (mapRef.current) {
        const mapInstance = googleMapsService.createMap(mapRef.current, {
          zoom: 11,
          center: { lat: 20.9101, lng: 107.1839 },
          styles: [
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'on' }]
            },
            {
              featureType: 'transit',
              elementType: 'labels.icon',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });
        setMap(mapInstance);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Map initialization failed:', error);
      toast({
        title: 'Lỗi tải bản đồ',
        description: 'Không thể khởi tạo Google Maps',
        status: 'error',
        duration: 3000,
      });
      setIsLoading(false);
    }
  };

  const getCurrentLocation = useCallback(async () => {
    try {
      const position = await googleMapsService.getCurrentPosition();
      setUserLocation(position);
      
      if (map) {
        map.panTo(position);
        map.setZoom(15);
        
        // Add user location marker
        googleMapsService.createMarker(position, {
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          title: 'Vị trí của bạn'
        });
      }
      
      toast({
        title: 'Đã tìm thấy vị trí',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Lỗi định vị',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  }, [map, toast]);

  const handleSearch = useCallback(async (query = searchQuery) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await googleMapsService.searchPlaces(query);
      
      // Clear existing markers
      setMarkers([]);
      
      if (results && results.length > 0) {
        const newMarkers = results.slice(0, 10).map((place, index) => {
          const marker = googleMapsService.createMarker(place.geometry.location, {
            title: place.name,
            animation: google.maps.Animation.DROP
          });
          
          marker.addListener('click', () => {
            setSelectedPlace(place);
          });
          
          return { marker, place };
        });
        
        setMarkers(newMarkers);
        
        // Fit bounds to show all results
        const bounds = googleMapsService.createBounds(
          results.map(place => place.geometry.location)
        );
        googleMapsService.fitBounds(bounds);
        
        toast({
          title: `Tìm thấy ${results.length} kết quả`,
          status: 'success',
          duration: 2000,
        });
      } else {
        toast({
          title: 'Không tìm thấy kết quả',
          status: 'info',
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi tìm kiếm',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, toast]);

  const handleGetDirections = useCallback(async (place) => {
    if (!userLocation) {
      await getCurrentLocation();
      return;
    }
    
    try {
      const result = await googleMapsService.calculateRoute(userLocation, place.geometry.location);
      setDirections(result);
      
      const route = result.routes[0];
      const leg = route.legs[0];
      setRouteInfo({
        distance: leg.distance.text,
        duration: leg.duration.text,
        startAddress: leg.start_address,
        endAddress: leg.end_address
      });
      
      // Render directions on map
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 5,
        }
      });
      directionsRenderer.setDirections(result);
      directionsRenderer.setMap(map);
      
    } catch (error) {
      toast({
        title: 'Lỗi tính đường',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  }, [userLocation, getCurrentLocation, map, toast]);

  const clearDirections = () => {
    setDirections(null);
    setRouteInfo(null);
    // Clear directions renderer from map
    if (map) {
      map.setDirections(null);
    }
  };

  const handleClose = () => {
    setMarkers([]);
    setSelectedPlace(null);
    setDirections(null);
    setRouteInfo(null);
    setSearchQuery('');
    googleMapsService.clearCache();
    onClose();
  };

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <Center p={8}>
            <Text color="red.500">Google Maps API key chưa được cấu hình</Text>
          </Center>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full">
      <ModalOverlay />
      <ModalContent m={0} borderRadius={0}>
        <Flex h="100vh">
          {/* Sidebar */}
          <Box w="400px" bg={sidebarBg} borderRight="1px" borderColor={borderColor}>
            <VStack spacing={0} align="stretch" h="100%">
              {/* Header */}
              <Box p={4} bg={bgColor} borderBottom="1px" borderColor={borderColor}>
                <HStack justify="space-between" mb={3}>
                  <Text fontSize="lg" fontWeight="bold">Google Maps</Text>
                  <IconButton
                    icon={<FaTimes />}
                    size="sm"
                    variant="ghost"
                    onClick={handleClose}
                    aria-label="Đóng"
                  />
                </HStack>
                
                {/* Search */}
                <Box position="relative">
                  <InputGroup>
                    <InputLeftElement>
                      <FaSearch color="gray" />
                    </InputLeftElement>
                    <Input
                      placeholder="Tìm kiếm địa điểm..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                  </InputGroup>
                  
                  <SearchSuggestions
                    query={searchQuery}
                    isVisible={showSuggestions}
                    onSelect={(suggestion) => {
                      setSearchQuery(suggestion.description);
                      setShowSuggestions(false);
                      handleSearch(suggestion.description);
                    }}
                  />
                </Box>
                
                {/* Action Buttons */}
                <HStack mt={3} spacing={2}>
                  <Button
                    size="sm"
                    onClick={() => handleSearch()}
                    isLoading={isSearching}
                    colorScheme="blue"
                    flex={1}
                  >
                    Tìm kiếm
                  </Button>
                  <Tooltip label="Vị trí hiện tại">
                    <IconButton
                      icon={<FaLocationArrow />}
                      size="sm"
                      onClick={getCurrentLocation}
                      aria-label="Vị trí hiện tại"
                    />
                  </Tooltip>
                  {directions && (
                    <Tooltip label="Xóa chỉ đường">
                      <IconButton
                        icon={<FaTimes />}
                        size="sm"
                        onClick={clearDirections}
                        colorScheme="red"
                        variant="outline"
                        aria-label="Xóa chỉ đường"
                      />
                    </Tooltip>
                  )}
                </HStack>
              </Box>

              {/* Route Info */}
              {routeInfo && (
                <Box p={4} bg="blue.50" borderBottom="1px" borderColor={borderColor}>
                  <HStack spacing={2} mb={2}>
                    <FaRoute color="blue" />
                    <Text fontSize="sm" fontWeight="bold">Chỉ đường</Text>
                  </HStack>
                  <VStack spacing={1} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="blue.600" fontWeight="bold">
                        {routeInfo.distance}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {routeInfo.duration}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              )}

              {/* Content Area */}
              <Box flex={1} overflowY="auto">
                {selectedPlace ? (
                  <PlaceDetails
                    place={selectedPlace}
                    onGetDirections={() => handleGetDirections(selectedPlace)}
                    onClose={() => setSelectedPlace(null)}
                  />
                ) : (
                  <Box p={4}>
                    {markers.length > 0 ? (
                      <VStack spacing={2} align="stretch">
                        <Text fontSize="sm" fontWeight="bold" mb={2}>
                          Kết quả ({markers.length})
                        </Text>
                        {markers.map(({ place }, index) => (
                          <Box
                            key={index}
                            p={3}
                            bg={bgColor}
                            borderRadius="md"
                            border="1px"
                            borderColor={borderColor}
                            cursor="pointer"
                            _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                            onClick={() => {
                              setSelectedPlace(place);
                              map?.panTo(place.geometry.location);
                              map?.setZoom(16);
                            }}
                          >
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                                {place.name}
                              </Text>
                              <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                {place.formatted_address}
                              </Text>
                              {place.rating && (
                                <HStack spacing={1}>
                                  <Text fontSize="xs">⭐</Text>
                                  <Text fontSize="xs">{place.rating}</Text>
                                </HStack>
                              )}
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <Center h="200px">
                        <VStack spacing={3}>
                          <FaMapMarkerAlt size="24px" color="gray" />
                          <Text fontSize="sm" color="gray.500" textAlign="center">
                            Tìm kiếm địa điểm để xem kết quả
                          </Text>
                        </VStack>
                      </Center>
                    )}
                  </Box>
                )}
              </Box>
            </VStack>
          </Box>

          {/* Map Container */}
          <Box flex={1} position="relative">
            {isLoading ? (
              <Center h="100%">
                <VStack spacing={3}>
                  <Spinner size="xl" color="blue.500" />
                  <Text>Đang tải bản đồ...</Text>
                </VStack>
              </Center>
            ) : (
              <Box ref={mapRef} w="100%" h="100%" />
            )}
            
            {/* Map Controls */}
            <VStack
              position="absolute"
              top={4}
              right={4}
              spacing={2}
            >
              <Tooltip label="Toàn màn hình">
                <IconButton
                  icon={<FaExpand />}
                  size="sm"
                  bg={bgColor}
                  shadow="md"
                  aria-label="Toàn màn hình"
                />
              </Tooltip>
              <Tooltip label="La bàn">
                <IconButton
                  icon={<FaCompass />}
                  size="sm"
                  bg={bgColor}
                  shadow="md"
                  aria-label="La bàn"
                />
              </Tooltip>
            </VStack>
          </Box>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default MapView;