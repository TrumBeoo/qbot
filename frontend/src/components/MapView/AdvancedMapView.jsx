// src/components/MapView/AdvancedMapView.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useColorModeValue,
  IconButton,
  Tooltip,
  Flex,
  Badge,
  useToast,
  Spinner,
  Center,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Divider,
  Card,
  CardBody,
  Image,
  SimpleGrid,
  Switch,
  FormControl,
  FormLabel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import { 
  FaSearch, 
  FaMapMarkerAlt, 
  FaRoute, 
  FaLocationArrow,
  FaCompass,
  FaTimes,
  FaCar,
  FaWalking,
  FaBicycle,
  FaBus,
  FaFilter,
  FaList,
  FaMap,
  FaStar,
  FaPhone,
  FaGlobe,
  FaClock,
  FaDollarSign,
  FaEye,
  FaDirections
} from 'react-icons/fa';
import googleMapsService from '../../services/googleMapsService';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AdvancedMapView = ({ isOpen, onClose, initialQuery = '', initialLocation = null }) => {
  // State management
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(initialLocation);
  const [directions, setDirections] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [multipleRoutes, setMultipleRoutes] = useState([]);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchRadius, setSearchRadius] = useState(5000);
  const [placeType, setPlaceType] = useState('');
  const [travelMode, setTravelMode] = useState('driving');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  
  const searchInputRef = useRef(null);
  const mapRef = useRef(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Initialize Google Maps API
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const isLoaded = await googleMapsService.initialize();
        if (isLoaded && mapRef.current) {
          const mapInstance = googleMapsService.createMap(mapRef.current, {
            center: userLocation || { lat: 21.0285, lng: 105.8542 },
            zoom: userLocation ? 15 : 10
          });
          setMap(mapInstance);
        }
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        toast({
          title: 'Lỗi khởi tạo bản đồ',
          description: 'Không thể tải Google Maps',
          status: 'error',
          duration: 3000,
        });
      }
    };

    if (isOpen) {
      initializeMap();
    }
  }, [isOpen, userLocation, toast]);

  // Auto search when modal opens with initial query
  useEffect(() => {
    if (isOpen && initialQuery && map) {
      setSearchQuery(initialQuery);
      setTimeout(() => {
        handleSearch();
      }, 1000);
    }
  }, [isOpen, initialQuery, map]);

  // Get user's current location
  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await googleMapsService.getCurrentPosition();
      setUserLocation(location);
      
      if (map) {
        map.panTo(location);
        map.setZoom(15);
        
        // Add user location marker
        googleMapsService.createMarker(location, {
          title: 'Vị trí của bạn',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
          }
        });
      }
      
      toast({
        title: 'Vị trí hiện tại',
        description: 'Đã tìm thấy vị trí của bạn',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: 'Lỗi định vị',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  }, [map, toast]);

  // Autocomplete search
  const handleAutocomplete = useCallback(async (input) => {
    if (!input.trim() || input.length < 2) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      const predictions = await googleMapsService.getAutocompletePredictions(input, {
        location: userLocation,
        radius: 50000
      });
      
      setAutocompleteResults(predictions);
      setShowAutocomplete(true);
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  }, [userLocation]);

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleAutocomplete(value);
  };

  // Select autocomplete suggestion
  const selectAutocompleteSuggestion = (prediction) => {
    setSearchQuery(prediction.description);
    setShowAutocomplete(false);
    handleSearch(prediction.description);
  };

  // Search for places
  const handleSearch = useCallback(async (query = searchQuery) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setShowAutocomplete(false);

    try {
      // Use backend API for search
      const response = await axios.post(`${API_BASE_URL}/api/maps/search`, {
        query: query,
        location: userLocation,
        radius: searchRadius,
        language: 'vi'
      });

      if (response.data.success) {
        const results = response.data.results;
        setSearchResults(results);
        
        // Clear existing markers
        setMarkers([]);
        
        // Add new markers
        const newMarkers = results.map((place, index) => {
          const marker = googleMapsService.createMarker(place.location, {
            title: place.name,
            animation: google.maps.Animation.DROP
          });
          
          // Add click listener
          marker.addListener('click', () => {
            setSelectedMarker(place);
            getPlaceDetails(place.place_id);
          });
          
          return { ...place, marker };
        });
        
        setMarkers(newMarkers);
        
        if (newMarkers.length > 0) {
          // Fit map to show all markers
          const bounds = googleMapsService.createBounds(
            newMarkers.map(m => m.location)
          );
          googleMapsService.fitBounds(bounds);
          
          toast({
            title: 'Tìm kiếm thành công',
            description: `Tìm thấy ${newMarkers.length} kết quả`,
            status: 'success',
            duration: 2000,
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Lỗi tìm kiếm',
        description: 'Không thể tìm kiếm địa điểm',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, userLocation, searchRadius, toast]);

  // Search nearby places
  const handleNearbySearch = useCallback(async () => {
    if (!userLocation) {
      getCurrentLocation();
      return;
    }

    setIsSearching(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/nearby`, {
        location: userLocation,
        radius: searchRadius,
        type: placeType || undefined,
        language: 'vi'
      });

      if (response.data.success) {
        const results = response.data.results;
        setNearbyPlaces(results);
        setActiveTab(1); // Switch to nearby tab
        
        toast({
          title: 'Tìm kiếm gần đây',
          description: `Tìm thấy ${results.length} địa điểm`,
          status: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Nearby search error:', error);
      toast({
        title: 'Lỗi tìm kiếm',
        description: 'Không thể tìm địa điểm gần đây',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSearching(false);
    }
  }, [userLocation, searchRadius, placeType, getCurrentLocation, toast]);

  // Get place details
  const getPlaceDetails = useCallback(async (placeId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/maps/place/${placeId}`, {
        params: { language: 'vi' }
      });

      if (response.data.success) {
        setPlaceDetails(response.data.result);
      }
    } catch (error) {
      console.error('Place details error:', error);
    }
  }, []);

  // Calculate directions
  const calculateDirections = useCallback(async (destination) => {
    if (!userLocation) {
      getCurrentLocation();
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/directions`, {
        origin: `${userLocation.lat},${userLocation.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: travelMode,
        language: 'vi'
      });

      if (response.data.success) {
        const route = response.data.route;
        setRouteInfo(route);
        
        // Display route on map using Google Maps Directions Service
        const directionsResult = await googleMapsService.calculateRoute(
          userLocation,
          destination,
          { travelMode: google.maps.TravelMode[travelMode.toUpperCase()] }
        );
        
        setDirections(directionsResult);
        setActiveTab(2); // Switch to directions tab
        
        toast({
          title: 'Tính đường thành công',
          description: `${route.distance} - ${route.duration}`,
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Directions error:', error);
      toast({
        title: 'Lỗi tính đường',
        description: 'Không thể tính toán lộ trình',
        status: 'error',
        duration: 3000,
      });
    }
  }, [userLocation, travelMode, getCurrentLocation, toast]);

  // Calculate multiple routes
  const calculateMultipleRoutes = useCallback(async (destination) => {
    if (!userLocation) {
      getCurrentLocation();
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/directions/multiple`, {
        origin: `${userLocation.lat},${userLocation.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        language: 'vi'
      });

      if (response.data.success) {
        setMultipleRoutes(response.data.routes);
        setActiveTab(2); // Switch to directions tab
      }
    } catch (error) {
      console.error('Multiple routes error:', error);
    }
  }, [userLocation, getCurrentLocation]);

  // Clear directions
  const clearDirections = useCallback(() => {
    setDirections(null);
    setRouteInfo(null);
    setMultipleRoutes([]);
  }, []);

  // Handle modal close
  const handleClose = () => {
    setMarkers([]);
    setSelectedMarker(null);
    setDirections(null);
    setRouteInfo(null);
    setSearchResults([]);
    setNearbyPlaces([]);
    setMultipleRoutes([]);
    setPlaceDetails(null);
    setSearchQuery('');
    setShowAutocomplete(false);
    onClose();
  };

  // Travel mode options
  const travelModes = [
    { value: 'driving', label: 'Lái xe', icon: FaCar },
    { value: 'walking', label: 'Đi bộ', icon: FaWalking },
    { value: 'bicycling', label: 'Xe đạp', icon: FaBicycle },
    { value: 'transit', label: 'Phương tiện công cộng', icon: FaBus }
  ];

  // Place types for filtering
  const placeTypes = [
    { value: '', label: 'Tất cả' },
    { value: 'restaurant', label: 'Nhà hàng' },
    { value: 'lodging', label: 'Khách sạn' },
    { value: 'tourist_attraction', label: 'Điểm du lịch' },
    { value: 'gas_station', label: 'Cây xăng' },
    { value: 'hospital', label: 'Bệnh viện' },
    { value: 'bank', label: 'Ngân hàng' },
    { value: 'shopping_mall', label: 'Trung tâm mua sắm' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full">
      <ModalOverlay />
      <ModalContent maxW="95vw" maxH="95vh">
        <ModalHeader>
          <HStack justify="space-between">
            <Text>Google Maps - Tích hợp đầy đủ</Text>
            <HStack>
              {routeInfo && (
                <Badge colorScheme="blue" p={2} borderRadius="md">
                  {routeInfo.distance} - {routeInfo.duration}
                </Badge>
              )}
            </HStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <HStack spacing={4} align="stretch" h="80vh">
            {/* Left Panel - Controls */}
            <VStack w="400px" spacing={4} align="stretch">
              {/* Search Controls */}
              <Card>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Text fontWeight="bold">Tìm kiếm</Text>
                    <Box position="relative">
                      <Input
                        ref={searchInputRef}
                        placeholder="Tìm kiếm địa điểm..."
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      {showAutocomplete && autocompleteResults.length > 0 && (
                        <Box
                          position="absolute"
                          top="100%"
                          left={0}
                          right={0}
                          bg={bgColor}
                          border="1px"
                          borderColor={borderColor}
                          borderRadius="md"
                          zIndex={1000}
                          maxH="200px"
                          overflowY="auto"
                        >
                          {autocompleteResults.map((prediction, index) => (
                            <Box
                              key={prediction.place_id}
                              p={2}
                              cursor="pointer"
                              _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                              onClick={() => selectAutocompleteSuggestion(prediction)}
                            >
                              <Text fontSize="sm">{prediction.description}</Text>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                    <HStack>
                      <Button
                        leftIcon={<FaSearch />}
                        onClick={() => handleSearch()}
                        isLoading={isSearching}
                        colorScheme="blue"
                        flex={1}
                      >
                        Tìm
                      </Button>
                      <Tooltip label="Vị trí hiện tại">
                        <IconButton
                          icon={<FaLocationArrow />}
                          onClick={getCurrentLocation}
                          aria-label="Current location"
                        />
                      </Tooltip>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Filters */}
              <Card>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Text fontWeight="bold">Bộ lọc</Text>
                    <FormControl>
                      <FormLabel fontSize="sm">Bán kính tìm kiếm (m)</FormLabel>
                      <Slider
                        value={searchRadius}
                        onChange={setSearchRadius}
                        min={1000}
                        max={50000}
                        step={1000}
                      >
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                      <Text fontSize="xs" color="gray.500">{searchRadius}m</Text>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Loại địa điểm</FormLabel>
                      <Select value={placeType} onChange={(e) => setPlaceType(e.target.value)}>
                        {placeTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      leftIcon={<FaCompass />}
                      onClick={handleNearbySearch}
                      isLoading={isSearching}
                      colorScheme="green"
                      size="sm"
                    >
                      Tìm gần đây
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* Travel Mode */}
              <Card>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Text fontWeight="bold">Phương tiện di chuyển</Text>
                    <SimpleGrid columns={2} spacing={2}>
                      {travelModes.map(mode => (
                        <Button
                          key={mode.value}
                          leftIcon={<mode.icon />}
                          size="sm"
                          variant={travelMode === mode.value ? 'solid' : 'outline'}
                          colorScheme={travelMode === mode.value ? 'blue' : 'gray'}
                          onClick={() => setTravelMode(mode.value)}
                        >
                          {mode.label}
                        </Button>
                      ))}
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>

              {/* Results Tabs */}
              <Card flex={1}>
                <CardBody>
                  <Tabs index={activeTab} onChange={setActiveTab}>
                    <TabList>
                      <Tab>Kết quả</Tab>
                      <Tab>Gần đây</Tab>
                      <Tab>Chỉ đường</Tab>
                    </TabList>
                    
                    <TabPanels>
                      {/* Search Results */}
                      <TabPanel p={0} pt={4}>
                        <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                          {searchResults.map((place) => (
                            <Card key={place.place_id} size="sm">
                              <CardBody>
                                <VStack align="start" spacing={1}>
                                  <HStack justify="space-between" w="100%">
                                    <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                                      {place.name}
                                    </Text>
                                    {place.rating && (
                                      <HStack spacing={1}>
                                        <FaStar color="gold" size="12px" />
                                        <Text fontSize="xs">{place.rating}</Text>
                                      </HStack>
                                    )}
                                  </HStack>
                                  <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                    {place.address}
                                  </Text>
                                  <HStack spacing={1} mt={1}>
                                    <Button
                                      size="xs"
                                      leftIcon={<FaEye />}
                                      onClick={() => {
                                        setSelectedMarker(place);
                                        getPlaceDetails(place.place_id);
                                        map?.panTo(place.location);
                                        map?.setZoom(15);
                                      }}
                                    >
                                      Xem
                                    </Button>
                                    <Button
                                      size="xs"
                                      leftIcon={<FaDirections />}
                                      onClick={() => calculateDirections(place.location)}
                                      colorScheme="blue"
                                    >
                                      Chỉ đường
                                    </Button>
                                  </HStack>
                                </VStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      </TabPanel>

                      {/* Nearby Places */}
                      <TabPanel p={0} pt={4}>
                        <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                          {nearbyPlaces.map((place) => (
                            <Card key={place.place_id} size="sm">
                              <CardBody>
                                <VStack align="start" spacing={1}>
                                  <HStack justify="space-between" w="100%">
                                    <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                                      {place.name}
                                    </Text>
                                    {place.rating && (
                                      <HStack spacing={1}>
                                        <FaStar color="gold" size="12px" />
                                        <Text fontSize="xs">{place.rating}</Text>
                                      </HStack>
                                    )}
                                  </HStack>
                                  <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                    {place.address}
                                  </Text>
                                  <HStack spacing={1} mt={1}>
                                    <Button
                                      size="xs"
                                      leftIcon={<FaEye />}
                                      onClick={() => {
                                        setSelectedMarker(place);
                                        getPlaceDetails(place.place_id);
                                      }}
                                    >
                                      Xem
                                    </Button>
                                    <Button
                                      size="xs"
                                      leftIcon={<FaDirections />}
                                      onClick={() => calculateDirections(place.location)}
                                      colorScheme="blue"
                                    >
                                      Chỉ đường
                                    </Button>
                                  </HStack>
                                </VStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      </TabPanel>

                      {/* Directions */}
                      <TabPanel p={0} pt={4}>
                        <VStack spacing={3} align="stretch">
                          {routeInfo && (
                            <Card>
                              <CardBody>
                                <VStack align="start" spacing={2}>
                                  <Text fontWeight="bold" fontSize="sm">Thông tin lộ trình</Text>
                                  <HStack justify="space-between" w="100%">
                                    <Text fontSize="xs">Khoảng cách:</Text>
                                    <Text fontSize="xs" fontWeight="bold">{routeInfo.distance}</Text>
                                  </HStack>
                                  <HStack justify="space-between" w="100%">
                                    <Text fontSize="xs">Thời gian:</Text>
                                    <Text fontSize="xs" fontWeight="bold">{routeInfo.duration}</Text>
                                  </HStack>
                                  <Button
                                    size="xs"
                                    leftIcon={<FaTimes />}
                                    onClick={clearDirections}
                                    colorScheme="red"
                                    variant="outline"
                                  >
                                    Xóa chỉ đường
                                  </Button>
                                </VStack>
                              </CardBody>
                            </Card>
                          )}
                          
                          {multipleRoutes.length > 0 && (
                            <VStack spacing={2} align="stretch">
                              <Text fontWeight="bold" fontSize="sm">Các phương tiện khác</Text>
                              {multipleRoutes.map((route, index) => (
                                <Card key={index} size="sm">
                                  <CardBody>
                                    <HStack justify="space-between">
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="xs" fontWeight="bold">
                                          {route.mode === 'driving' && 'Lái xe'}
                                          {route.mode === 'walking' && 'Đi bộ'}
                                          {route.mode === 'bicycling' && 'Xe đạp'}
                                          {route.mode === 'transit' && 'Phương tiện công cộng'}
                                        </Text>
                                        <Text fontSize="xs" color="gray.600">
                                          {route.distance} - {route.duration}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                  </CardBody>
                                </Card>
                              ))}
                            </VStack>
                          )}
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </CardBody>
              </Card>
            </VStack>

            {/* Right Panel - Map */}
            <Box flex={1} position="relative">
              <Box
                ref={mapRef}
                w="100%"
                h="100%"
                borderRadius="md"
                border="1px"
                borderColor={borderColor}
              />
              
              {!googleMapsService.isApiLoaded() && (
                <Center
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  bg={bgColor}
                  borderRadius="md"
                >
                  <VStack>
                    <Spinner size="xl" />
                    <Text>Đang tải Google Maps...</Text>
                  </VStack>
                </Center>
              )}
            </Box>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AdvancedMapView;