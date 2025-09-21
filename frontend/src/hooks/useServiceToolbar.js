import { useState, useCallback, useMemo } from 'react';
import { generateServiceQuery, requiresSpecialHandling } from '../utils/serviceUtils';

export const useServiceToolbar = ({ onServiceSelect, onMapClick, onRouteClick, onLocationClick, onDirectionClick, onAdvancedMapClick }) => {
  const [showServiceToolbar, setShowServiceToolbar] = useState(false);
  const [activeService, setActiveService] = useState(null);

  // Memoize service configurations
  const serviceConfigs = useMemo(() => ({
    // Core map services
    map: {
      icon: 'FaMap',
      label: 'Bản đồ',
      color: 'blue',
      description: 'Xem bản đồ du lịch Quảng Ninh',
      category: 'navigation',
      handler: onMapClick,
      suggestions: [
        'Vịnh Hạ Long',
        'Đảo Cát Bà', 
        'Yên Tử',
        'Chùa Ba Vàng'
      ]
    },
    route: {
      icon: 'FaRoute',
      label: 'Tìm đường',
      color: 'green',
      description: 'Tìm đường đi tối ưu',
      category: 'navigation',
      handler: onRouteClick,
      suggestions: [
        'Từ Hà Nội đến Hạ Long',
        'Từ sân bay đến trung tâm',
        'Đường đi Yên Tử',
        'Lộ trình 1 ngày'
      ]
    },
    location: {
      icon: 'FaMapMarkerAlt',
      label: 'Địa điểm',
      color: 'red',
      description: 'Khám phá địa điểm gần đây',
      category: 'navigation',
      handler: onLocationClick,
      suggestions: [
        'Nhà hàng gần đây',
        'Khách sạn 4 sao',
        'Điểm tham quan',
        'Cửa hàng lưu niệm'
      ]
    },
    direction: {
      icon: 'FaCompass',
      label: 'Hướng dẫn',
      color: 'purple',
      description: 'Hướng dẫn đi lại chi tiết',
      category: 'navigation',
      handler: onDirectionClick,
      suggestions: [
        'Cách đi bằng xe bus',
        'Thuê xe máy ở đâu',
        'Lịch tàu cao tốc',
        'Bãi đỗ xe gần đây'
      ]
    },
    // Tourism services
    hotel: {
      icon: 'FaHotel',
      label: 'Khách sạn',
      color: 'orange',
      description: 'Tìm kiếm khách sạn và lưu trú',
      category: 'tourism',
      suggestions: [
        'Khách sạn 5 sao Hạ Long',
        'Resort view biển',
        'Homestay Cát Bà',
        'Khách sạn giá rẻ'
      ]
    },
    restaurant: {
      icon: 'FaUtensils',
      label: 'Ẩm thực',
      color: 'yellow',
      description: 'Khám phá ẩm thực địa phương',
      category: 'tourism',
      suggestions: [
        'Hải sản tươi sống',
        'Chả cá Hạ Long',
        'Bánh cuốn Thanh Trì',
        'Quán ăn địa phương'
      ]
    },
    attraction: {
      icon: 'FaCamera',
      label: 'Tham quan',
      color: 'pink',
      description: 'Điểm tham quan nổi tiếng',
      category: 'tourism',
      suggestions: [
        'Động Thiên Cung',
        'Núi Bài Thơ',
        'Làng chài Cửa Vạn',
        'Chợ đêm Hạ Long'
      ]
    },
    shopping: {
      icon: 'FaShoppingBag',
      label: 'Mua sắm',
      color: 'teal',
      description: 'Mua sắm và lưu niệm',
      category: 'tourism',
      suggestions: [
        'Chợ Hạ Long',
        'Trung tâm thương mại',
        'Đặc sản Quảng Ninh',
        'Ngọc trai Hạ Long'
      ]
    },
    // Utility services
    weather: {
      icon: 'FaUmbrella',
      label: 'Thời tiết',
      color: 'cyan',
      description: 'Thông tin thời tiết',
      category: 'utility',
      suggestions: ['Thời tiết Quảng Ninh hôm nay']
    },
    info: {
      icon: 'FaInfoCircle',
      label: 'Thông tin',
      color: 'gray',
      description: 'Thông tin du lịch',
      category: 'utility',
      suggestions: ['Thông tin du lịch Quảng Ninh']
    },
    transport: {
      icon: 'FaCar',
      label: 'Phương tiện',
      color: 'orange',
      description: 'Phương tiện di chuyển',
      category: 'utility',
      suggestions: ['Thuê xe ở Quảng Ninh']
    },
    ticket: {
      icon: 'FaPlane',
      label: 'Vé',
      color: 'blue',
      description: 'Vé máy bay & tàu',
      category: 'utility',
      suggestions: ['Vé máy bay đi Quảng Ninh']
    }
  }), [onMapClick, onRouteClick, onLocationClick, onDirectionClick]);

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const grouped = {};
    Object.entries(serviceConfigs).forEach(([key, service]) => {
      if (!grouped[service.category]) {
        grouped[service.category] = {};
      }
      grouped[service.category][key] = service;
    });
    return grouped;
  }, [serviceConfigs]);

  // Handle service selection
  const handleServiceSelect = useCallback((serviceType, suggestion) => {
    const service = serviceConfigs[serviceType];
    
    if (suggestion) {
      onServiceSelect?.(serviceType, suggestion);
    }
    
    // Call specific handler if available
    if (service?.handler) {
      service.handler();
    }
    
    setShowServiceToolbar(false);
    setActiveService(null);
  }, [serviceConfigs, onServiceSelect]);

  // Handle service click (for navigation services)
  const handleServiceClick = useCallback((serviceType) => {
    const service = serviceConfigs[serviceType];
    
    if (service?.handler) {
      service.handler();
      setShowServiceToolbar(false);
    } else {
      // For services without specific handlers, just trigger selection
      handleServiceSelect(serviceType, null);
    }
  }, [serviceConfigs, handleServiceSelect]);

  // Toggle toolbar visibility
  const toggleToolbar = useCallback(() => {
    setShowServiceToolbar(prev => !prev);
  }, []);

  // Close toolbar
  const closeToolbar = useCallback(() => {
    setShowServiceToolbar(false);
    setActiveService(null);
  }, []);

  // Set active service
  const setActiveServiceHandler = useCallback((serviceType) => {
    setActiveService(serviceType);
  }, []);

  return {
    // State
    showServiceToolbar,
    activeService,
    
    // Data
    serviceConfigs,
    servicesByCategory,
    
    // Handlers
    handleServiceSelect,
    handleServiceClick,
    toggleToolbar,
    closeToolbar,
    setActiveService: setActiveServiceHandler
  };
};

export default useServiceToolbar;