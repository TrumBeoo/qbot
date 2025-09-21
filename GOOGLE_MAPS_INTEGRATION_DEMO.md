# Google Maps API Integration Demo

## Tổng quan tích hợp

Chúng ta đã tích hợp đầy đủ các dịch vụ Google Maps API vào ứng dụng chatbot:

### 1. Maps JavaScript API (Frontend)
- **File**: `frontend/src/services/googleMapsService.js`
- **Tính năng**: Load và hiển thị bản đồ tương tác
- **Components**: `AdvancedMapView.jsx`

### 2. Places API (Frontend + Backend)
- **Frontend**: Tìm kiếm, autocomplete, chi tiết địa điểm
- **Backend**: `backend/services/google_maps_service.py`
- **Endpoints**: 
  - `/api/maps/search` - Tìm kiếm địa điểm
  - `/api/maps/nearby` - Tìm địa điểm gần đây
  - `/api/maps/place/{place_id}` - Chi tiết địa điểm
  - `/api/maps/autocomplete` - Gợi ý tự động

### 3. Directions API (Backend)
- **Endpoints**:
  - `/api/maps/directions` - Tính lộ trình
  - `/api/maps/directions/multiple` - Nhiều phương tiện
- **Tính năng**: Tính toán lộ trình, thời gian, khoảng cách

### 4. Distance Matrix API (Backend)
- **Endpoint**: `/api/maps/distance-matrix`
- **Tính năng**: Tính khoảng cách giữa nhiều điểm

### 5. Geolocation API (Frontend)
- **File**: `frontend/src/components/MapView/GeolocationTracker.jsx`
- **Tính năng**: Xác định vị trí thiết bị, theo dõi real-time

## Cách sử dụng

### 1. Từ Chat Interface
Người dùng có thể gõ các câu lệnh:
- "Tìm nhà hàng gần đây"
- "Chỉ đường từ Hà Nội đến Sapa"
- "Địa điểm du lịch ở Đà Nẵng"
- "Vị trí hiện tại của tôi"

### 2. Từ Advanced Map View
- Click nút "Bản đồ nâng cao" trong ChatInput
- Sử dụng đầy đủ tính năng tìm kiếm, chỉ đường, định vị

### 3. API Endpoints
```javascript
// Tìm kiếm địa điểm
POST /api/maps/search
{
  "query": "nhà hàng",
  "location": {"lat": 21.0285, "lng": 105.8542},
  "radius": 5000
}

// Tính lộ trình
POST /api/maps/directions
{
  "origin": "Hà Nội",
  "destination": "Sapa",
  "mode": "driving"
}

// Định vị ngược
POST /api/maps/reverse-geocode
{
  "location": {"lat": 21.0285, "lng": 105.8542}
}
```

## Tính năng chính

### Frontend Features
✅ **Interactive Map**: Bản đồ tương tác với Google Maps
✅ **Search & Autocomplete**: Tìm kiếm với gợi ý tự động
✅ **Place Details**: Hiển thị thông tin chi tiết địa điểm
✅ **Directions**: Tính toán và hiển thị lộ trình
✅ **Geolocation**: Xác định vị trí người dùng
✅ **Real-time Tracking**: Theo dõi vị trí real-time
✅ **Multiple Travel Modes**: Lái xe, đi bộ, xe đạp, phương tiện công cộng

### Backend Features
✅ **Places Search**: Tìm kiếm địa điểm theo text
✅ **Nearby Search**: Tìm địa điểm gần đây
✅ **Place Details**: Lấy thông tin chi tiết
✅ **Autocomplete**: Gợi ý địa điểm
✅ **Directions**: Tính lộ trình
✅ **Distance Matrix**: Tính khoảng cách nhiều điểm
✅ **Geocoding**: Chuyển đổi địa chỉ ↔ tọa độ
✅ **Popular Locations**: Danh sách địa điểm phổ biến VN

## Test Cases

### 1. Test Basic Search
```bash
curl -X POST http://localhost:5000/api/maps/search \
  -H "Content-Type: application/json" \
  -d '{"query": "nhà hàng Hà Nội"}'
```

### 2. Test Nearby Search
```bash
curl -X POST http://localhost:5000/api/maps/nearby \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": 21.0285, "lng": 105.8542},
    "radius": 5000,
    "type": "restaurant"
  }'
```

### 3. Test Directions
```bash
curl -X POST http://localhost:5000/api/maps/directions \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Hà Nội",
    "destination": "Sapa",
    "mode": "driving"
  }'
```

## Cấu hình

### Environment Variables
```env
# Backend (.env)
GOOGLE_MAPS_API_KEY=AIzaSyBWJuzurI2ZiWMyJBquuEVY3-Dt4puRxyo

# Frontend (.env)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBWJuzurI2ZiWMyJBquuEVY3-Dt4puRxyo
```

### API Key Permissions
Đảm bảo API key có quyền truy cập:
- Maps JavaScript API
- Places API
- Directions API
- Distance Matrix API
- Geocoding API

## Troubleshooting

### 1. API Key Issues
- Kiểm tra API key có đúng không
- Kiểm tra quyền truy cập APIs
- Kiểm tra billing account

### 2. CORS Issues
- Đảm bảo domain được whitelist
- Kiểm tra HTTP referrer restrictions

### 3. Rate Limiting
- Implement caching
- Optimize API calls
- Monitor usage quotas

## Performance Optimization

### 1. Frontend
- Lazy load Google Maps API
- Cache search results
- Debounce autocomplete requests
- Optimize marker rendering

### 2. Backend
- Implement Redis caching
- Rate limiting
- Request batching
- Error handling & retry logic

## Security Considerations

### 1. API Key Security
- Restrict API key by domain/IP
- Use separate keys for frontend/backend
- Monitor API usage

### 2. Input Validation
- Sanitize search queries
- Validate coordinates
- Rate limit requests

## Future Enhancements

### 1. Advanced Features
- Street View integration
- Traffic layer
- Custom map styles
- Offline map support

### 2. AI Integration
- Smart location suggestions
- Natural language processing
- Personalized recommendations
- Route optimization

### 3. Mobile Features
- GPS tracking
- Push notifications
- Offline functionality
- AR navigation

## Monitoring & Analytics

### 1. API Usage Tracking
- Monitor API quotas
- Track popular searches
- Analyze user behavior

### 2. Performance Metrics
- Response times
- Error rates
- User engagement
- Map interactions

---

## Kết luận

Tích hợp Google Maps API đã hoàn thành với đầy đủ tính năng:
- ✅ Maps JavaScript API
- ✅ Places API (search, autocomplete, details)
- ✅ Directions API (routing, multiple modes)
- ✅ Distance Matrix API (multi-point distances)
- ✅ Geolocation API (device location, tracking)

Ứng dụng hiện có khả năng:
1. Hiển thị bản đồ tương tác
2. Tìm kiếm và gợi ý địa điểm
3. Tính toán lộ trình và khoảng cách
4. Xác định và theo dõi vị trí người dùng
5. Tích hợp AI chatbot với các tính năng bản đồ

Hệ thống đã sẵn sàng để sử dụng và có thể mở rộng thêm các tính năng nâng cao.