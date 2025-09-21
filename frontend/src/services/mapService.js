// src/services/mapService.js
import axios from 'axios';
import googleMapsService from './googleMapsService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class MapService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }

  // Parse location queries from chat messages
  parseLocationQuery(message) {
    const lowerMessage = message.toLowerCase();
    
    // Patterns for different types of location queries
    const patterns = {
      showMap: /(?:hiển thị|xem|mở)\s*(?:bản đồ|map)/i,
      findPlace: /(?:tìm|tìm kiếm|địa điểm|nơi)\s*(.+?)(?:\s+(?:ở|tại|trong)\s*(.+?))?$/i,
      getDirections: /(?:chỉ đường|tìm đường|đi từ)\s*(.+?)\s*(?:đến|tới)\s*(.+?)$/i,
      nearbyPlaces: /(?:gần đây|xung quanh|lân cận)\s*(.+?)?$/i,
      currentLocation: /(?:vị trí hiện tại|ở đâu|tôi đang ở)/i
    };

    // Check for map display request
    if (patterns.showMap.test(lowerMessage)) {
      return {
        type: 'showMap',
        query: this.extractLocationFromMessage(message)
      };
    }

    // Check for directions request
    const directionsMatch = lowerMessage.match(patterns.getDirections);
    if (directionsMatch) {
      return {
        type: 'directions',
        origin: directionsMatch[1]?.trim(),
        destination: directionsMatch[2]?.trim()
      };
    }

    // Check for place search
    const placeMatch = lowerMessage.match(patterns.findPlace);
    if (placeMatch) {
      return {
        type: 'findPlace',
        query: placeMatch[1]?.trim(),
        location: placeMatch[2]?.trim()
      };
    }

    // Check for nearby places
    const nearbyMatch = lowerMessage.match(patterns.nearbyPlaces);
    if (nearbyMatch) {
      return {
        type: 'nearbyPlaces',
        query: nearbyMatch[1]?.trim() || 'địa điểm du lịch'
      };
    }

    // Check for current location
    if (patterns.currentLocation.test(lowerMessage)) {
      return {
        type: 'currentLocation'
      };
    }

    return null;
  }

  // Extract location information from message
  extractLocationFromMessage(message) {
    // Common location keywords in Vietnamese
    const locationKeywords = [
      'hà nội', 'hồ chí minh', 'đà nẵng', 'hải phòng', 'cần thơ',
      'quảng ninh', 'lào cai', 'sapa', 'hạ long', 'phú quốc',
      'nha trang', 'đà lạt', 'hội an', 'huế', 'vũng tàu'
    ];

    const lowerMessage = message.toLowerCase();
    
    for (const location of locationKeywords) {
      if (lowerMessage.includes(location)) {
        return location;
      }
    }

    // Try to extract location after common prepositions
    const locationPatterns = [
      /(?:ở|tại|trong)\s+([^,.\s]+(?:\s+[^,.\s]+)*)/i,
      /(?:đến|tới)\s+([^,.\s]+(?:\s+[^,.\s]+)*)/i,
      /(?:từ)\s+([^,.\s]+(?:\s+[^,.\s]+)*)/i
    ];

    for (const pattern of locationPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return '';
  }

  // Generate map-related responses
  generateMapResponse(queryType, data = {}) {
    const responses = {
      showMap: `Tôi sẽ mở bản đồ${data.query ? ` cho khu vực ${data.query}` : ''} để bạn xem. Bạn có thể tìm kiếm địa điểm, xem chỉ đường và khám phá các điểm thú vị xung quanh.`,
      
      findPlace: `Tôi sẽ tìm kiếm "${data.query}"${data.location ? ` tại ${data.location}` : ''} trên bản đồ. Bạn sẽ thấy các kết quả phù hợp với đánh giá và thông tin chi tiết.`,
      
      directions: `Tôi sẽ chỉ đường từ ${data.origin} đến ${data.destination}. Bản đồ sẽ hiển thị lộ trình tối ưu với thời gian và khoảng cách dự kiến.`,
      
      nearbyPlaces: `Tôi sẽ tìm ${data.query} gần vị trí của bạn. Hãy cho phép truy cập vị trí để có kết quả chính xác nhất.`,
      
      currentLocation: `Tôi sẽ xác định vị trí hiện tại của bạn trên bản đồ. Vui lòng cho phép truy cập vị trí khi được yêu cầu.`,
      
      default: `Tôi sẽ mở bản đồ để hỗ trợ bạn. Bạn có thể tìm kiếm địa điểm, xem chỉ đường và khám phá các khu vực thú vị.`
    };

    return responses[queryType] || responses.default;
  }

  // Backend API integration methods
  async searchPlacesAPI(query, location = null, radius = 50000) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/search`, {
        query,
        location,
        radius,
        language: 'vi'
      });
      return response.data;
    } catch (error) {
      console.error('Search places API error:', error);
      throw error;
    }
  }

  async searchNearbyAPI(location, radius = 5000, type = null) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/nearby`, {
        location,
        radius,
        type,
        language: 'vi'
      });
      return response.data;
    } catch (error) {
      console.error('Search nearby API error:', error);
      throw error;
    }
  }

  async getDirectionsAPI(origin, destination, mode = 'driving') {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/directions`, {
        origin,
        destination,
        mode,
        language: 'vi'
      });
      return response.data;
    } catch (error) {
      console.error('Get directions API error:', error);
      throw error;
    }
  }

  async getMultipleRoutesAPI(origin, destination) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/directions/multiple`, {
        origin,
        destination,
        language: 'vi'
      });
      return response.data;
    } catch (error) {
      console.error('Get multiple routes API error:', error);
      throw error;
    }
  }

  async calculateDistanceMatrixAPI(origins, destinations, mode = 'driving') {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/distance-matrix`, {
        origins,
        destinations,
        mode,
        language: 'vi'
      });
      return response.data;
    } catch (error) {
      console.error('Distance matrix API error:', error);
      throw error;
    }
  }

  async findNearestAPI(userLocation, query, radius = 50000) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/nearest`, {
        user_location: userLocation,
        query,
        radius,
        language: 'vi'
      });
      return response.data;
    } catch (error) {
      console.error('Find nearest API error:', error);
      throw error;
    }
  }

  async getPlaceDetailsAPI(placeId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/maps/place/${placeId}`, {
        params: { language: 'vi' }
      });
      return response.data;
    } catch (error) {
      console.error('Get place details API error:', error);
      throw error;
    }
  }

  async getAutocompleteAPI(input, location = null, radius = 50000) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/autocomplete`, {
        input,
        location,
        radius,
        language: 'vi'
      });
      return response.data;
    } catch (error) {
      console.error('Autocomplete API error:', error);
      throw error;
    }
  }

  async geocodeAddressAPI(address) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/geocode`, {
        address,
        language: 'vi'
      });
      return response.data;
    } catch (error) {
      console.error('Geocode API error:', error);
      throw error;
    }
  }

  async reverseGeocodeAPI(location) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/maps/reverse-geocode`, {
        location,
        language: 'vi'
      });
      return response.data;
    } catch (error) {
      console.error('Reverse geocode API error:', error);
      throw error;
    }
  }

  async getPopularLocationsAPI() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/maps/popular-locations`);
      return response.data;
    } catch (error) {
      console.error('Get popular locations API error:', error);
      throw error;
    }
  }

  // Enhanced map processing with AI integration
  async processMapQuery(message, userLocation = null) {
    const queryData = this.parseLocationQuery(message);
    
    if (!queryData) return null;

    try {
      let result = null;
      
      switch (queryData.type) {
        case 'showMap':
          if (queryData.query) {
            result = await this.searchPlacesAPI(queryData.query, userLocation);
          }
          break;
          
        case 'findPlace':
          const searchQuery = this.formatLocationQuery(queryData.query, queryData.location);
          result = await this.searchPlacesAPI(searchQuery, userLocation);
          break;
          
        case 'directions':
          result = await this.getDirectionsAPI(queryData.origin, queryData.destination);
          break;
          
        case 'nearbyPlaces':
          if (userLocation) {
            result = await this.searchNearbyAPI(userLocation, 5000);
          }
          break;
          
        case 'currentLocation':
          // This will be handled by frontend geolocation
          result = { type: 'geolocation_request' };
          break;
      }

      return {
        queryType: queryData.type,
        result: result,
        response: this.generateMapResponse(queryData.type, queryData)
      };
    } catch (error) {
      console.error('Process map query error:', error);
      return {
        queryType: queryData.type,
        error: error.message,
        response: 'Xin lỗi, tôi không thể xử lý yêu cầu bản đồ này lúc này.'
      };
    }
  }

  // Smart location suggestions with AI
  async getSmartSuggestions(userLocation = null, context = '') {
    try {
      const suggestions = [];
      
      // Get popular locations
      const popularResponse = await this.getPopularLocationsAPI();
      if (popularResponse.success) {
        suggestions.push(...popularResponse.locations.slice(0, 5));
      }
      
      // Get nearby suggestions if user location is available
      if (userLocation) {
        const nearbyResponse = await this.searchNearbyAPI(userLocation, 10000, 'tourist_attraction');
        if (nearbyResponse.success) {
          suggestions.push(...nearbyResponse.results.slice(0, 3));
        }
      }
      
      // Context-based suggestions
      if (context.includes('ăn') || context.includes('nhà hàng')) {
        const restaurantResponse = await this.searchNearbyAPI(userLocation, 5000, 'restaurant');
        if (restaurantResponse.success) {
          suggestions.push(...restaurantResponse.results.slice(0, 3));
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('Get smart suggestions error:', error);
      return this.getQuickSuggestions(); // Fallback to static suggestions
    }
  }

  // Check if message is map-related
  isMapRelated(message) {
    const mapKeywords = [
      'bản đồ', 'map', 'địa điểm', 'chỉ đường', 'tìm đường',
      'vị trí', 'ở đâu', 'gần đây', 'xung quanh', 'lân cận',
      'đi từ', 'đến', 'tới', 'route', 'navigation', 'google maps',
      'tọa độ', 'kinh độ', 'vĩ độ', 'gps', 'định vị', 'homestay',
      'khách sạn', 'nhà hàng', 'du lịch', 'tham quan'
    ];

    const lowerMessage = message.toLowerCase();
    return mapKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Get coordinates for popular Vietnamese locations
  getLocationCoordinates(locationName) {
    const locations = {
      'hà nội': { lat: 21.0285, lng: 105.8542 },
      'hồ chí minh': { lat: 10.8231, lng: 106.6297 },
      'sài gòn': { lat: 10.8231, lng: 106.6297 },
      'đà nẵng': { lat: 16.0471, lng: 108.2068 },
      'hải phòng': { lat: 20.8449, lng: 106.6881 },
      'cần thơ': { lat: 10.0452, lng: 105.7469 },
      'hạ long': { lat: 20.9101, lng: 107.1839 },
      'sapa': { lat: 22.3380, lng: 103.8442 },
      'đà lạt': { lat: 11.9404, lng: 108.4583 },
      'nha trang': { lat: 12.2388, lng: 109.1967 },
      'hội an': { lat: 15.8801, lng: 108.3380 },
      'huế': { lat: 16.4637, lng: 107.5909 },
      'phú quốc': { lat: 10.2899, lng: 103.9840 },
      'vũng tàu': { lat: 10.4113, lng: 107.1365 }
    };

    const lowerName = locationName.toLowerCase();
    return locations[lowerName] || null;
  }

  // Generate quick location suggestions focused on Quang Ninh tourism
  getQuickSuggestions() {
    return [
      'Vịnh Hạ Long Quảng Ninh',
      'Đảo Cát Bà Quảng Ninh', 
      'Chùa Yên Tử Quảng Ninh',
      'Bãi Cháy Hạ Long',
      'Nhà hàng hải sản Hạ Long',
      'Khách sạn view vịnh Hạ Long',
      'Tour du thuyền Hạ Long',
      'Cáp treo Yên Tử',
      'Chợ đêm Hạ Long',
      'Bảo tàng Quảng Ninh'
    ];
  }

  // Get Quang Ninh specific tourism services
  getQuangNinhServices() {
    return [
      {
        name: 'Khách sạn Hạ Long',
        query: 'Khách sạn tốt nhất Hạ Long Quảng Ninh view vịnh',
        category: 'accommodation',
        rating: 4.5
      },
      {
        name: 'Nhà hàng hải sản',
        query: 'Nhà hàng hải sản ngon và nổi tiếng ở Hạ Long',
        category: 'restaurant',
        rating: 4.3
      },
      {
        name: 'Tour du thuyền',
        query: 'Tour du thuyền vịnh Hạ Long 1 ngày 2 ngày',
        category: 'tour',
        rating: 4.7
      },
      {
        name: 'Cáp treo Yên Tử',
        query: 'Cáp treo lên đỉnh Yên Tử Quảng Ninh',
        category: 'attraction',
        rating: 4.4
      },
      {
        name: 'Chợ đêm Hạ Long',
        query: 'Chợ đêm Hạ Long mua sắm đặc sản',
        category: 'shopping',
        rating: 4.0
      }
    ];
  }

  // Get popular destinations focused on Quang Ninh
  getPopularDestinations() {
    return [
      {
        name: 'Vịnh Hạ Long',
        location: 'Hạ Long, Quảng Ninh',
        coordinates: { lat: 20.9101, lng: 107.1839 },
        description: 'Di sản thiên nhiên thế giới UNESCO',
        type: 'nature'
      },
      {
        name: 'Đảo Cát Bà',
        location: 'Cát Bà, Hải Phòng',
        coordinates: { lat: 20.8067, lng: 107.0433 },
        description: 'Vườn quốc gia và bãi biển đẹp',
        type: 'nature'
      },
      {
        name: 'Chùa Yên Tử',
        location: 'Uông Bí, Quảng Ninh',
        coordinates: { lat: 21.1167, lng: 106.7667 },
        description: 'Phật giáo Trúc Lâm Yên Tử',
        type: 'culture'
      },
      {
        name: 'Bãi Cháy',
        location: 'Hạ Long, Quảng Ninh',
        coordinates: { lat: 20.9500, lng: 107.0833 },
        description: 'Bãi biển và khu vui chơi giải trí',
        type: 'beach'
      },
      {
        name: 'Cửa Ông',
        location: 'Cẩm Phả, Quảng Ninh',
        coordinates: { lat: 21.0167, lng: 107.3000 },
        description: 'Cảng biển và khu du lịch',
        type: 'port'
      },
      {
        name: 'Đảo Tuần Châu',
        location: 'Hạ Long, Quảng Ninh',
        coordinates: { lat: 20.9167, lng: 107.0500 },
        description: 'Khu nghỉ dưỡng và giải trí cao cấp',
        type: 'resort'
      },
      {
        name: 'Bảo tàng Quảng Ninh',
        location: 'Hạ Long, Quảng Ninh',
        coordinates: { lat: 20.9500, lng: 107.0667 },
        description: 'Bảo tàng hiện đại về lịch sử và văn hóa',
        type: 'museum'
      }
    ];
  }

  // Format location for search
  formatLocationQuery(query, location = '') {
    if (!query) return location || 'Việt Nam';
    
    let formattedQuery = query.trim();
    
    // Add location context if provided
    if (location && !formattedQuery.toLowerCase().includes(location.toLowerCase())) {
      formattedQuery += ` ${location}`;
    }
    
    // Add Vietnam context if no specific location mentioned
    if (!this.containsVietnameseLocation(formattedQuery)) {
      formattedQuery += ' Việt Nam';
    }
    
    return formattedQuery;
  }

  // Check if query contains Vietnamese location
  containsVietnameseLocation(query) {
    const vietnameseLocations = [
      'việt nam', 'vietnam', 'hà nội', 'hồ chí minh', 'sài gòn',
      'đà nẵng', 'hải phòng', 'cần thơ', 'quảng ninh', 'lào cai',
      'nghệ an', 'thanh hóa', 'thừa thiên huế', 'quảng nam',
      'bình định', 'phú yên', 'khánh hòa', 'ninh thuận', 'bình thuận',
      'đồng nai', 'bà rịa vũng tàu', 'long an', 'tiền giang',
      'bến tre', 'trà vinh', 'vĩnh long', 'đồng tháp', 'an giang',
      'kiên giang', 'cà mau', 'bạc liêu', 'sóc trăng', 'hậu giang'
    ];

    const lowerQuery = query.toLowerCase();
    return vietnameseLocations.some(location => lowerQuery.includes(location));
  }
}

export const mapService = new MapService();
export default mapService;