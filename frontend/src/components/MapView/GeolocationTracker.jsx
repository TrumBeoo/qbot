// src/components/MapView/GeolocationTracker.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Switch,
  FormControl,
  FormLabel,
  Badge,
  Card,
  CardBody,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid
} from '@chakra-ui/react';
import {
  FaLocationArrow,
  FaPlay,
  FaStop,
  FaCrosshairs,
  FaRoute,
  FaClock,
  FaSpeedometer
} from 'react-icons/fa';
import googleMapsService from '../../services/googleMapsService';

const GeolocationTracker = ({ onLocationUpdate, map }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [watchId, setWatchId] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [heading, setHeading] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [trackingDuration, setTrackingDuration] = useState(0);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [highAccuracy, setHighAccuracy] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(5000); // 5 seconds
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [error, setError] = useState(null);

  const toast = useToast();

  // Check geolocation permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state);
        
        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
        });
      });
    }
  }, []);

  // Update tracking duration
  useEffect(() => {
    let interval;
    if (isTracking && trackingStartTime) {
      interval = setInterval(() => {
        setTrackingDuration(Date.now() - trackingStartTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, trackingStartTime]);

  // Calculate distance between two points
  const calculateDistance = useCallback((point1, point2) => {
    if (!googleMapsService.isApiLoaded()) return 0;
    return googleMapsService.calculateDistance(point1, point2);
  }, []);

  // Handle location update
  const handleLocationUpdate = useCallback((position) => {
    const newLocation = {
      lat: position.lat,
      lng: position.lng,
      accuracy: position.accuracy,
      timestamp: position.timestamp || Date.now(),
      speed: position.speed || null,
      heading: position.heading || null
    };

    setCurrentLocation(newLocation);
    setAccuracy(position.accuracy);
    setSpeed(position.speed);
    setHeading(position.heading);
    setLastUpdate(new Date(newLocation.timestamp));
    setError(null);

    // Update location history
    setLocationHistory(prev => {
      const newHistory = [...prev, newLocation];
      
      // Calculate total distance
      if (prev.length > 0) {
        const lastLocation = prev[prev.length - 1];
        const distance = calculateDistance(lastLocation, newLocation);
        setTotalDistance(prevTotal => prevTotal + distance);
      }
      
      // Keep only last 100 positions to avoid memory issues
      return newHistory.slice(-100);
    });

    // Update map if available
    if (map) {
      map.panTo(newLocation);
      
      // Add marker for current position
      googleMapsService.createMarker(newLocation, {
        title: 'Vị trí hiện tại',
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

    // Notify parent component
    if (onLocationUpdate) {
      onLocationUpdate(newLocation);
    }
  }, [map, onLocationUpdate, calculateDistance]);

  // Handle location error
  const handleLocationError = useCallback((error) => {
    let errorMessage = 'Lỗi không xác định';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Người dùng từ chối quyền truy cập vị trí';
        setPermissionStatus('denied');
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Thông tin vị trí không khả dụng';
        break;
      case error.TIMEOUT:
        errorMessage = 'Yêu cầu vị trí đã hết thời gian chờ';
        break;
      default:
        errorMessage = error.message || 'Lỗi không xác định';
    }

    setError(errorMessage);
    toast({
      title: 'Lỗi định vị',
      description: errorMessage,
      status: 'error',
      duration: 5000,
    });
  }, [toast]);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị');
      return;
    }

    try {
      // Get initial position
      const initialPosition = await googleMapsService.getCurrentPosition({
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 0
      });

      handleLocationUpdate(initialPosition);

      // Start watching position
      const id = googleMapsService.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: highAccuracy,
          timeout: updateInterval,
          maximumAge: 1000
        }
      );

      setWatchId(id);
      setIsTracking(true);
      setTrackingStartTime(Date.now());
      setTotalDistance(0);
      setLocationHistory([]);

      toast({
        title: 'Bắt đầu theo dõi',
        description: 'Đang theo dõi vị trí của bạn',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      handleLocationError(error);
    }
  }, [highAccuracy, updateInterval, handleLocationUpdate, handleLocationError, toast]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchId) {
      googleMapsService.clearWatch(watchId);
      setWatchId(null);
    }

    setIsTracking(false);
    setTrackingStartTime(null);
    setTrackingDuration(0);

    toast({
      title: 'Dừng theo dõi',
      description: 'Đã dừng theo dõi vị trí',
      status: 'info',
      duration: 2000,
    });
  }, [watchId, toast]);

  // Get current position once
  const getCurrentPosition = useCallback(async () => {
    try {
      const position = await googleMapsService.getCurrentPosition({
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 60000
      });

      handleLocationUpdate(position);

      toast({
        title: 'Vị trí hiện tại',
        description: 'Đã cập nhật vị trí của bạn',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      handleLocationError(error);
    }
  }, [highAccuracy, handleLocationUpdate, handleLocationError, toast]);

  // Format duration
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // Format distance
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  // Format speed
  const formatSpeed = (metersPerSecond) => {
    if (!metersPerSecond) return 'N/A';
    const kmh = metersPerSecond * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Permission Status */}
      {permissionStatus === 'denied' && (
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Quyền truy cập vị trí bị từ chối!</AlertTitle>
            <AlertDescription>
              Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt để sử dụng tính năng này.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <Card>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <Text fontWeight="bold">Điều khiển định vị</Text>
            
            <HStack spacing={2}>
              <Button
                leftIcon={<FaLocationArrow />}
                onClick={getCurrentPosition}
                size="sm"
                isDisabled={permissionStatus === 'denied'}
              >
                Vị trí hiện tại
              </Button>
              
              {!isTracking ? (
                <Button
                  leftIcon={<FaPlay />}
                  onClick={startTracking}
                  colorScheme="green"
                  size="sm"
                  isDisabled={permissionStatus === 'denied'}
                >
                  Bắt đầu theo dõi
                </Button>
              ) : (
                <Button
                  leftIcon={<FaStop />}
                  onClick={stopTracking}
                  colorScheme="red"
                  size="sm"
                >
                  Dừng theo dõi
                </Button>
              )}
            </HStack>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="high-accuracy" mb="0" fontSize="sm">
                Độ chính xác cao
              </FormLabel>
              <Switch
                id="high-accuracy"
                isChecked={highAccuracy}
                onChange={(e) => setHighAccuracy(e.target.checked)}
                isDisabled={isTracking}
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      {/* Current Location Info */}
      {currentLocation && (
        <Card>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Text fontWeight="bold">Thông tin vị trí</Text>
              
              <SimpleGrid columns={2} spacing={3}>
                <Stat size="sm">
                  <StatLabel>Vĩ độ</StatLabel>
                  <StatNumber fontSize="sm">{currentLocation.lat.toFixed(6)}</StatNumber>
                </Stat>
                
                <Stat size="sm">
                  <StatLabel>Kinh độ</StatLabel>
                  <StatNumber fontSize="sm">{currentLocation.lng.toFixed(6)}</StatNumber>
                </Stat>
                
                <Stat size="sm">
                  <StatLabel>Độ chính xác</StatLabel>
                  <StatNumber fontSize="sm">{formatDistance(accuracy || 0)}</StatNumber>
                  <StatHelpText>
                    <Progress
                      value={Math.max(0, 100 - (accuracy || 0) / 10)}
                      size="sm"
                      colorScheme={accuracy < 10 ? 'green' : accuracy < 50 ? 'yellow' : 'red'}
                    />
                  </StatHelpText>
                </Stat>
                
                <Stat size="sm">
                  <StatLabel>Tốc độ</StatLabel>
                  <StatNumber fontSize="sm">{formatSpeed(speed)}</StatNumber>
                </Stat>
              </SimpleGrid>

              {lastUpdate && (
                <Text fontSize="xs" color="gray.500">
                  Cập nhật lần cuối: {lastUpdate.toLocaleTimeString()}
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Tracking Statistics */}
      {isTracking && (
        <Card>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="bold">Thống kê theo dõi</Text>
                <Badge colorScheme="green" variant="solid">
                  Đang theo dõi
                </Badge>
              </HStack>
              
              <SimpleGrid columns={2} spacing={3}>
                <Stat size="sm">
                  <StatLabel>
                    <HStack spacing={1}>
                      <FaClock />
                      <Text>Thời gian</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="sm">{formatDuration(trackingDuration)}</StatNumber>
                </Stat>
                
                <Stat size="sm">
                  <StatLabel>
                    <HStack spacing={1}>
                      <FaRoute />
                      <Text>Quãng đường</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="sm">{formatDistance(totalDistance)}</StatNumber>
                </Stat>
                
                <Stat size="sm">
                  <StatLabel>Điểm theo dõi</StatLabel>
                  <StatNumber fontSize="sm">{locationHistory.length}</StatNumber>
                </Stat>
                
                <Stat size="sm">
                  <StatLabel>
                    <HStack spacing={1}>
                      <FaSpeedometer />
                      <Text>Tốc độ TB</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="sm">
                    {trackingDuration > 0 
                      ? formatSpeed((totalDistance / (trackingDuration / 1000)))
                      : 'N/A'
                    }
                  </StatNumber>
                </Stat>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Location History */}
      {locationHistory.length > 0 && (
        <Card>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Text fontWeight="bold">Lịch sử vị trí ({locationHistory.length} điểm)</Text>
              
              <Box maxH="150px" overflowY="auto">
                <VStack spacing={1} align="stretch">
                  {locationHistory.slice(-5).reverse().map((location, index) => (
                    <HStack key={location.timestamp} justify="space-between" fontSize="xs">
                      <Text>
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </Text>
                      <Text color="gray.500">
                        {new Date(location.timestamp).toLocaleTimeString()}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
              
              {locationHistory.length > 5 && (
                <Text fontSize="xs" color="blue.500" cursor="pointer">
                  Xem tất cả {locationHistory.length} điểm...
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default GeolocationTracker;