# Google Maps Integration Guide

## Tổng quan
Tính năng Google Maps đã được tích hợp vào chatbot để cung cấp các chức năng liên quan đến bản đồ và định vị.

## Tính năng chính

### 1. Hiển thị bản đồ
- Mở bản đồ Google Maps trong modal
- Tìm kiếm địa điểm
- Hiển thị thông tin chi tiết về địa điểm
- Đánh giá và hình ảnh địa điểm

### 2. Tìm đường và chỉ đường
- Tính toán lộ trình tối ưu
- Hiển thị khoảng cách và thời gian di chuyển
- Chỉ đường từ vị trí hiện tại đến điểm đến
- Hỗ trợ nhiều phương tiện di chuyển

### 3. Định vị và tìm kiếm gần đây
- Xác định vị trí hiện tại của người dùng
- Tìm kiếm địa điểm gần đây
- Gợi ý các điểm quan tâm xung quanh

### 4. Gợi ý thông minh
- Gợi ý tìm kiếm phổ biến
- Điểm đến du lịch nổi tiếng
- Hành động nhanh (vị trí hiện tại, chỉ đường)

## Cách sử dụng

### 1. Thông qua Chat
Người dùng có thể gõ các câu lệnh tự nhiên:

```
- "Hiển thị bản đồ Hà Nội"
- "Tìm nhà hàng gần đây"
- "Chỉ đường từ Hà Nội đến Sapa"
- "Địa điểm du lịch ở Đà Nẵng"
- "Vị trí hiện tại của tôi"
```

### 2. Thông qua Menu
- Click vào nút "+" trong chat input
- Chọn các tùy chọn bản đồ:
  - **Gợi ý bản đồ**: Hiển thị các gợi ý tìm kiếm
  - **Bản đồ du lịch**: Mở bản đồ với địa điểm du lịch
  - **Tìm đường**: Tính toán lộ trình
  - **Địa điểm gần đây**: Tìm kiếm xung quanh
  - **Hướng dẫn đi lại**: Chỉ đường chi tiết

## Cấu hình API Key

### 1. Google Maps API Key
API key đã được cấu hình trong file `.env`:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBWJuzurI2ZiWMyJBquuEVY3-Dt4puRxyo
```

### 2. Các API cần kích hoạt
Đảm bảo các API sau đã được kích hoạt trong Google Cloud Console:
- Maps JavaScript API
- Places API
- Directions API
- Geocoding API

## Cấu trúc Code

### Components
- `MapView/MapView.jsx`: Component chính hiển thị bản đồ
- `MapView/InlineMap.jsx`: Bản đồ nhỏ inline trong chat
- `MapView/MapSuggestions.jsx`: Gợi ý tìm kiếm bản đồ

### Services
- `services/mapService.js`: Xử lý logic liên quan đến bản đồ
  - Parse câu lệnh từ người dùng
  - Tạo response phù hợp
  - Quản lý tọa độ các địa điểm phổ biến

### Integration
- Tích hợp vào `App.jsx` với state management
- Xử lý trong `ChatInput.jsx` với menu và gợi ý
- Auto-detect câu lệnh liên quan đến bản đồ

## Các Pattern được hỗ trợ

### 1. Hiển thị bản đồ
```
- "hiển thị bản đồ [địa điểm]"
- "xem bản đồ [địa điểm]"
- "mở bản đồ [địa điểm]"
```

### 2. Tìm kiếm địa điểm
```
- "tìm [loại địa điểm] ở [khu vực]"
- "địa điểm [loại] gần đây"
- "[loại địa điểm] xung quanh"
```

### 3. Chỉ đường
```
- "chỉ đường từ [A] đến [B]"
- "tìm đường từ [A] tới [B]"
- "đi từ [A] đến [B]"
```

### 4. Vị trí hiện tại
```
- "vị trí hiện tại"
- "tôi đang ở đâu"
- "định vị tôi"
```

## Tính năng nâng cao

### 1. Offline Support
- Cache các địa điểm phổ biến
- Fallback khi không có kết nối

### 2. Responsive Design
- Tối ưu cho mobile và desktop
- Touch-friendly controls

### 3. Accessibility
- Keyboard navigation
- Screen reader support
- High contrast mode

## Troubleshooting

### 1. API Key Issues
- Kiểm tra API key trong file .env
- Đảm bảo các API đã được kích hoạt
- Kiểm tra quota và billing

### 2. Location Permission
- Yêu cầu permission từ browser
- Fallback về location mặc định
- Thông báo lỗi rõ ràng

### 3. Performance
- Lazy loading cho map components
- Debounce search queries
- Optimize marker rendering

## Future Enhancements

### 1. Advanced Features
- Traffic information
- Public transport routes
- Street View integration
- Offline maps

### 2. AI Integration
- Smart location suggestions
- Context-aware recommendations
- Natural language processing

### 3. Social Features
- Share locations
- Collaborative trip planning
- Reviews and ratings

## Dependencies

```json
{
  "@googlemaps/js-api-loader": "^1.16.10",
  "@react-google-maps/api": "^2.20.7"
}
```

## Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security Considerations
- API key restrictions
- Domain whitelist
- Rate limiting
- Input validation