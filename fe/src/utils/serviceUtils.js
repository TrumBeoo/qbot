/**
 * Service utility functions for handling different service types
 */

export const SERVICE_TYPES = {
  HOTEL: 'hotel',
  RESTAURANT: 'restaurant',
  ATTRACTION: 'attraction',
  SHOPPING: 'shopping',
  TRANSPORT: 'transport',
  WEATHER: 'weather',
  INFO: 'info',
  TICKET: 'ticket'
};

/**
 * Generate service-specific queries based on service type and suggestion
 */
export const generateServiceQuery = (serviceType, suggestion, location = 'Quảng Ninh') => {
  if (suggestion) {
    return suggestion;
  }

  const queryTemplates = {
    [SERVICE_TYPES.HOTEL]: `Khách sạn tốt nhất tại ${location}`,
    [SERVICE_TYPES.RESTAURANT]: `Nhà hàng ngon tại ${location}`,
    [SERVICE_TYPES.ATTRACTION]: `Điểm tham quan nổi tiếng tại ${location}`,
    [SERVICE_TYPES.SHOPPING]: `Nơi mua sắm tại ${location}`,
    [SERVICE_TYPES.TRANSPORT]: `Phương tiện di chuyển tại ${location}`,
    [SERVICE_TYPES.WEATHER]: `Thời tiết ${location} hôm nay`,
    [SERVICE_TYPES.INFO]: `Thông tin du lịch ${location}`,
    [SERVICE_TYPES.TICKET]: `Vé máy bay đi ${location}`
  };

  return queryTemplates[serviceType] || `Thông tin về ${serviceType} tại ${location}`;
};

/**
 * Check if service requires special handling
 */
export const requiresSpecialHandling = (serviceType) => {
  return false; // No special handling needed after removing map services
};

/**
 * Get service category
 */
export const getServiceCategory = (serviceType) => {
  const tourismServices = [SERVICE_TYPES.HOTEL, SERVICE_TYPES.RESTAURANT, SERVICE_TYPES.ATTRACTION, SERVICE_TYPES.SHOPPING];
  const utilityServices = [SERVICE_TYPES.TRANSPORT, SERVICE_TYPES.WEATHER, SERVICE_TYPES.INFO, SERVICE_TYPES.TICKET];

  if (tourismServices.includes(serviceType)) return 'tourism';
  if (utilityServices.includes(serviceType)) return 'utility';
  
  return 'other';
};

/**
 * Format service suggestion for display
 */
export const formatServiceSuggestion = (suggestion, serviceType) => {
  if (!suggestion) return '';
  
  // Add service context if not already present
  const serviceContext = {
    [SERVICE_TYPES.HOTEL]: 'khách sạn',
    [SERVICE_TYPES.RESTAURANT]: 'nhà hàng',
    [SERVICE_TYPES.ATTRACTION]: 'điểm tham quan',
    [SERVICE_TYPES.SHOPPING]: 'mua sắm'
  };

  const context = serviceContext[serviceType];
  if (context && !suggestion.toLowerCase().includes(context)) {
    return `${suggestion} - ${context}`;
  }

  return suggestion;
};

/**
 * Validate service configuration
 */
export const validateServiceConfig = (config) => {
  const requiredFields = ['icon', 'label', 'color', 'category'];
  
  return requiredFields.every(field => config.hasOwnProperty(field));
};

/**
 * Get default service suggestions
 */
export const getDefaultSuggestions = (serviceType) => {
  const defaultSuggestions = {
    [SERVICE_TYPES.HOTEL]: ['Khách sạn 5 sao', 'Resort view biển'],
    [SERVICE_TYPES.RESTAURANT]: ['Hải sản tươi sống', 'Đặc sản địa phương'],
    [SERVICE_TYPES.ATTRACTION]: ['Động Thiên Cung', 'Núi Bài Thơ'],
    [SERVICE_TYPES.SHOPPING]: ['Chợ Hạ Long', 'Đặc sản Quảng Ninh']
  };

  return defaultSuggestions[serviceType] || [];
};