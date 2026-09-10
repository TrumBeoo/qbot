export const SERVICE_CATEGORIES = {
  NAVIGATION: 'navigation',
  TOURISM: 'tourism',
  UTILITY: 'utility'
};

export const CATEGORY_LABELS = {
  [SERVICE_CATEGORIES.NAVIGATION]: 'Bản đồ & Định vị',
  [SERVICE_CATEGORIES.TOURISM]: 'Dịch vụ Du lịch',
  [SERVICE_CATEGORIES.UTILITY]: 'Tiện ích'
};

export const DETAILED_SERVICE_DATA = {
  hotel: {
    title: 'Khách sạn & Lưu trú',
    icon: 'FaHotel',
    color: 'orange',
    categories: [
      {
        name: 'Khách sạn 5 sao',
        items: ['FLC Hạ Long Bay', 'Vinpearl Resort & Spa', 'Novotel Hạ Long Bay', 'Royal Lotus Hạ Long']
      },
      {
        name: 'Resort cao cấp',
        items: ['Flamingo Cát Bà Resort', 'Paradise Suites Hotel', 'Bhaya Cruise', 'Emperor Cruise']
      },
      {
        name: 'Homestay',
        items: ['Homestay Cát Bà', 'Nhà nghỉ gia đình', 'Phòng view biển', 'Gần chợ đêm']
      }
    ]
  },
  restaurant: {
    title: 'Ẩm thực & Nhà hàng',
    icon: 'FaUtensils',
    color: 'yellow',
    categories: [
      {
        name: 'Hải sản tươi sống',
        items: ['Chả cá Hạ Long', 'Tôm hùm nướng', 'Cua rang me', 'Ốc hương nướng']
      },
      {
        name: 'Đặc sản địa phương',
        items: ['Bánh cuốn Thanh Trì', 'Nem cua bể', 'Chả mực Hạ Long', 'Bánh gai']
      },
      {
        name: 'Nhà hàng cao cấp',
        items: ['Nhà hàng Emeralda', 'Golden Dragon Water Puppet', 'Sunset Restaurant', 'Floating Restaurant']
      }
    ]
  },
  attraction: {
    title: 'Điểm tham quan',
    icon: 'FaCamera',
    color: 'pink',
    categories: [
      {
        name: 'Di sản thế giới',
        items: ['Vịnh Hạ Long', 'Động Thiên Cung', 'Động Dầu Gỗ', 'Hang Sửng Sốt']
      },
      {
        name: 'Danh thắng nổi tiếng',
        items: ['Núi Bài Thơ', 'Đảo Titop', 'Làng chài Cửa Vạn', 'Chùa Ba Vàng']
      },
      {
        name: 'Hoạt động giải trí',
        items: ['Cáp treo Nữ Hoàng', 'Công viên Sun World', 'Chợ đêm Hạ Long', 'Bãi tắm Bãi Cháy']
      }
    ]
  },
  shopping: {
    title: 'Mua sắm & Lưu niệm',
    icon: 'FaShoppingBag',
    color: 'teal',
    categories: [
      {
        name: 'Đặc sản Quảng Ninh',
        items: ['Ngọc trai Hạ Long', 'Mực khô', 'Tôm khô', 'Bánh đậu xanh']
      },
      {
        name: 'Trung tâm mua sắm',
        items: ['Chợ Hạ Long', 'Vincom Plaza', 'Big C Hạ Long', 'Chợ đêm Bãi Cháy']
      },
      {
        name: 'Lưu niệm handmade',
        items: ['Tranh sơn mài', 'Đồ gỗ mỹ nghệ', 'Trang sức ngọc trai', 'Áo dài lụa']
      }
    ]
  },
  transport: {
    title: 'Phương tiện di chuyển',
    icon: 'FaCar',
    color: 'orange',
    categories: [
      {
        name: 'Thuê xe',
        items: ['Thuê xe máy', 'Thuê ô tô 4 chỗ', 'Thuê xe 7 chỗ', 'Xe có tài xế']
      },
      {
        name: 'Phương tiện công cộng',
        items: ['Xe bus Hà Nội - Hạ Long', 'Tàu cao tốc', 'Xe limousine', 'Taxi Grab']
      },
      {
        name: 'Du thuyền & Tàu',
        items: ['Du thuyền 1 ngày', 'Tàu ngủ đêm', 'Kayak', 'Thúng chai']
      }
    ]
  },
  weather: {
    title: 'Thông tin thời tiết',
    icon: 'FaUmbrella',
    color: 'cyan',
    categories: [
      {
        name: 'Thời tiết hiện tại',
        items: ['Nhiệt độ hôm nay', 'Độ ẩm không khí', 'Tốc độ gió', 'Tầm nhìn xa']
      },
      {
        name: 'Dự báo 7 ngày',
        items: ['Thời tiết tuần tới', 'Khả năng mưa', 'Nhiệt độ cao nhất', 'Nhiệt độ thấp nhất']
      },
      {
        name: 'Lời khuyên du lịch',
        items: ['Thời điểm tốt nhất', 'Nên mang gì', 'Hoạt động phù hợp', 'Cảnh báo thời tiết']
      }
    ]
  },
  ticket: {
    title: 'Vé & Đặt chỗ',
    icon: 'FaPlane',
    color: 'blue',
    categories: [
      {
        name: 'Vé máy bay',
        items: ['Hà Nội - Vân Đồn', 'TP.HCM - Vân Đồn', 'Đà Nẵng - Vân Đồn', 'Vé khứ hồi']
      },
      {
        name: 'Vé tham quan',
        items: ['Vé cáp treo', 'Vé du thuyền', 'Vé Sun World', 'Combo tour']
      },
      {
        name: 'Đặt tour',
        items: ['Tour 1 ngày', 'Tour 2N1Đ', 'Tour 3N2Đ', 'Tour trọn gói']
      }
    ]
  },
  info: {
    title: 'Thông tin du lịch',
    icon: 'FaInfoCircle',
    color: 'gray',
    categories: [
      {
        name: 'Hướng dẫn du lịch',
        items: ['Lịch trình gợi ý', 'Kinh nghiệm du lịch', 'Lưu ý an toàn', 'Văn hóa địa phương']
      },
      {
        name: 'Thông tin hữu ích',
        items: ['Số điện thoại khẩn cấp', 'Bệnh viện gần nhất', 'ATM & ngân hàng', 'Wifi miễn phí']
      },
      {
        name: 'Sự kiện & Lễ hội',
        items: ['Lễ hội Hạ Long', 'Sự kiện văn hóa', 'Chương trình biểu diễn', 'Hoạt động đêm']
      }
    ]
  }
};

export const QUICK_ACTIONS = {
  TOP_RATED: 'top_rated',
  NEAREST: 'nearest',
  POPULAR: 'popular',
  BUDGET: 'budget'
};

export const QUICK_ACTION_LABELS = {
  [QUICK_ACTIONS.TOP_RATED]: 'Top đánh giá',
  [QUICK_ACTIONS.NEAREST]: 'Gần nhất',
  [QUICK_ACTIONS.POPULAR]: 'Phổ biến',
  [QUICK_ACTIONS.BUDGET]: 'Giá rẻ'
};