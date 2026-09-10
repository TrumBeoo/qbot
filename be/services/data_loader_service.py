import os
import re
from typing import Dict, List, Any
from datetime import datetime
import pytz

class DataLoaderService:
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        self.vn_tz = pytz.timezone('Asia/Ho_Chi_Minh')
    
    def load_tourism_data(self) -> Dict[str, Any]:
        """Load dữ liệu du lịch từ file data.txt"""
        try:
            file_path = os.path.join(self.data_dir, 'data.txt')
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse dữ liệu thành các sections
            sections = self._parse_tourism_sections(content)
            
            return {
                'success': True,
                'data': {
                    'type': 'tourism_data',
                    'sections': sections,
                    'total_sections': len(sections),
                    'last_updated': datetime.now(self.vn_tz).isoformat()
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def load_hotel_data(self) -> Dict[str, Any]:
        """Load dữ liệu khách sạn từ file hotels.txt"""
        try:
            file_path = os.path.join(self.data_dir, 'hotels.txt')
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse dữ liệu khách sạn
            hotels = self._parse_hotel_data(content)
            
            return {
                'success': True,
                'data': {
                    'type': 'hotel_data',
                    'hotels': hotels,
                    'total_hotels': len(hotels),
                    'categories': list(set([hotel['category'] for hotel in hotels])),
                    'last_updated': datetime.now(self.vn_tz).isoformat()
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_analytics_data(self) -> Dict[str, Any]:
        """Tạo dữ liệu analytics từ dữ liệu thật"""
        try:
            tourism_data = self.load_tourism_data()
            hotel_data = self.load_hotel_data()
            
            if not tourism_data['success'] or not hotel_data['success']:
                return {'success': False, 'error': 'Failed to load base data'}
            
            # Tính toán analytics
            tourism_sections = tourism_data['data']['sections']
            hotels = hotel_data['data']['hotels']
            
            # Phân tích địa điểm
            locations = self._extract_locations(tourism_sections)
            
            # Phân tích loại hình du lịch
            tourism_types = self._analyze_tourism_types(tourism_sections)
            
            # Phân tích giá cả khách sạn
            price_analysis = self._analyze_hotel_prices(hotels)
            
            return {
                'success': True,
                'data': {
                    'overview': {
                        'total_locations': len(locations),
                        'total_hotels': len(hotels),
                        'tourism_sections': len(tourism_sections),
                        'last_updated': datetime.now(self.vn_tz).isoformat()
                    },
                    'locations': locations,
                    'tourism_types': tourism_types,
                    'hotel_analysis': price_analysis,
                    'popular_destinations': self._get_popular_destinations(tourism_sections),
                    'accommodation_stats': self._get_accommodation_stats(hotels)
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _parse_tourism_sections(self, content: str) -> List[Dict[str, Any]]:
        """Parse nội dung du lịch thành các sections"""
        sections = []
        
        # Split theo các số thứ tự
        parts = re.split(r'\n(\d+\.\s+[^\n]+)', content)
        
        current_section = None
        for i, part in enumerate(parts):
            if re.match(r'^\d+\.\s+', part):
                # Đây là tiêu đề section
                if current_section:
                    sections.append(current_section)
                
                current_section = {
                    'title': part.strip(),
                    'content': '',
                    'items': []
                }
            elif current_section and part.strip():
                # Đây là nội dung của section
                current_section['content'] += part.strip() + '\n'
                
                # Tìm các items con (có số thứ tự)
                items = re.findall(r'(\d+\.\s+[^\n]+(?:\n(?!\d+\.)[^\n]*)*)', part)
                for item in items:
                    current_section['items'].append(item.strip())
        
        if current_section:
            sections.append(current_section)
        
        return sections
    
    def _parse_hotel_data(self, content: str) -> List[Dict[str, Any]]:
        """Parse dữ liệu khách sạn"""
        hotels = []
        
        # Split theo các loại accommodation
        sections = re.split(r'\[([^\]]+)\]', content)
        
        current_category = None
        for i, section in enumerate(sections):
            if i % 2 == 1:  # Đây là category
                current_category = section.strip()
            elif current_category and section.strip():
                # Parse hotels trong category này
                hotel_blocks = re.split(r'\n(?=Tên:)', section.strip())
                
                for block in hotel_blocks:
                    if block.strip():
                        hotel = self._parse_hotel_block(block.strip(), current_category)
                        if hotel:
                            hotels.append(hotel)
        
        return hotels
    
    def _parse_hotel_block(self, block: str, category: str) -> Dict[str, Any]:
        """Parse một block thông tin khách sạn"""
        lines = block.split('\n')
        hotel = {'category': category}
        
        for line in lines:
            line = line.strip()
            if line.startswith('Tên:'):
                hotel['name'] = line.replace('Tên:', '').strip()
            elif line.startswith('Địa chỉ:'):
                hotel['address'] = line.replace('Địa chỉ:', '').strip()
            elif line.startswith('Loại:'):
                hotel['type'] = line.replace('Loại:', '').strip()
            elif line.startswith('Giá phòng:'):
                price_str = line.replace('Giá phòng:', '').strip()
                hotel['price_range'] = price_str
                hotel['price_min'], hotel['price_max'] = self._extract_price_range(price_str)
            elif line.startswith('Tiện nghi:'):
                amenities = line.replace('Tiện nghi:', '').strip()
                hotel['amenities'] = [a.strip() for a in amenities.split(',')]
            elif line.startswith('Gần địa điểm:'):
                nearby = line.replace('Gần địa điểm:', '').strip()
                hotel['nearby_attractions'] = [a.strip() for a in nearby.split(',')]
        
        return hotel if 'name' in hotel else None
    
    def _extract_price_range(self, price_str: str) -> tuple:
        """Trích xuất khoảng giá từ chuỗi"""
        try:
            # Tìm các số trong chuỗi giá
            numbers = re.findall(r'[\d,]+', price_str)
            if len(numbers) >= 2:
                min_price = int(numbers[0].replace(',', ''))
                max_price = int(numbers[1].replace(',', ''))
                return min_price, max_price
            elif len(numbers) == 1:
                price = int(numbers[0].replace(',', ''))
                return price, price
        except:
            pass
        return 0, 0
    
    def _extract_locations(self, sections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Trích xuất danh sách địa điểm từ các sections"""
        locations = []
        
        for section in sections:
            # Tìm các địa điểm được đề cập
            content = section['content']
            
            # Các pattern để tìm địa điểm
            location_patterns = [
                r'([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+)(?=:|\s-|\snổi tiếng|\slà)',
                r'(Vịnh [A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]*)',
                r'(Đảo [A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]*)',
                r'(Hang [A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]*)',
                r'(Bãi [A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]*)'
            ]
            
            for pattern in location_patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    location_name = match.strip()
                    if len(location_name) > 3 and location_name not in [loc['name'] for loc in locations]:
                        locations.append({
                            'name': location_name,
                            'section': section['title'],
                            'type': self._classify_location_type(location_name)
                        })
        
        return locations
    
    def _classify_location_type(self, location_name: str) -> str:
        """Phân loại loại hình địa điểm"""
        if 'Vịnh' in location_name:
            return 'Vịnh'
        elif 'Đảo' in location_name:
            return 'Đảo'
        elif 'Hang' in location_name or 'Động' in location_name:
            return 'Hang động'
        elif 'Bãi' in location_name:
            return 'Bãi biển'
        elif 'Chùa' in location_name:
            return 'Tâm linh'
        elif 'Sun World' in location_name or 'Công viên' in location_name:
            return 'Vui chơi giải trí'
        else:
            return 'Khác'
    
    def _analyze_tourism_types(self, sections: List[Dict[str, Any]]) -> Dict[str, int]:
        """Phân tích các loại hình du lịch"""
        types = {
            'Tham quan thiên nhiên': 0,
            'Tâm linh': 0,
            'Vui chơi giải trí': 0,
            'Ẩm thực': 0,
            'Nghỉ dưỡng': 0,
            'Lễ hội': 0
        }
        
        for section in sections:
            title = section['title'].lower()
            content = section['content'].lower()
            
            if any(word in title + content for word in ['vịnh', 'đảo', 'hang', 'động', 'bãi', 'thiên nhiên']):
                types['Tham quan thiên nhiên'] += 1
            if any(word in title + content for word in ['chùa', 'tâm linh', 'thiền', 'phật']):
                types['Tâm linh'] += 1
            if any(word in title + content for word in ['vui chơi', 'giải trí', 'công viên', 'sun world']):
                types['Vui chơi giải trí'] += 1
            if any(word in title + content for word in ['ẩm thực', 'món ăn', 'chả mực', 'sá sùng']):
                types['Ẩm thực'] += 1
            if any(word in title + content for word in ['tắm biển', 'nghỉ dưỡng', 'resort']):
                types['Nghỉ dưỡng'] += 1
            if any(word in title + content for word in ['lễ hội', 'carnaval', 'festival']):
                types['Lễ hội'] += 1
        
        return types
    
    def _analyze_hotel_prices(self, hotels: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Phân tích giá cả khách sạn"""
        if not hotels:
            return {}
        
        prices = []
        categories = {}
        
        for hotel in hotels:
            if 'price_min' in hotel and 'price_max' in hotel:
                avg_price = (hotel['price_min'] + hotel['price_max']) / 2
                prices.append(avg_price)
                
                category = hotel['category']
                if category not in categories:
                    categories[category] = []
                categories[category].append(avg_price)
        
        if not prices:
            return {}
        
        return {
            'average_price': sum(prices) / len(prices),
            'min_price': min(prices),
            'max_price': max(prices),
            'price_ranges': {
                'budget': len([p for p in prices if p < 1000000]),
                'mid_range': len([p for p in prices if 1000000 <= p < 3000000]),
                'luxury': len([p for p in prices if p >= 3000000])
            },
            'by_category': {
                cat: {
                    'average': sum(prices) / len(prices),
                    'count': len(prices)
                } for cat, prices in categories.items()
            }
        }
    
    def _get_popular_destinations(self, sections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Lấy các điểm đến phổ biến"""
        destinations = []
        
        # Các điểm đến được đề cập nhiều
        popular_places = [
            'Vịnh Hạ Long', 'Đảo Cô Tô', 'Yên Tử', 'Bình Liêu', 
            'Móng Cái', 'Hang Sửng Sốt', 'Đảo Ti Tốp', 'Sun World'
        ]
        
        for place in popular_places:
            count = 0
            description = ""
            
            for section in sections:
                if place.lower() in section['content'].lower():
                    count += 1
                    if not description and place.lower() in section['content'].lower():
                        # Lấy câu mô tả đầu tiên về địa điểm
                        sentences = section['content'].split('.')
                        for sentence in sentences:
                            if place.lower() in sentence.lower():
                                description = sentence.strip()
                                break
            
            if count > 0:
                destinations.append({
                    'name': place,
                    'mentions': count,
                    'description': description[:200] + '...' if len(description) > 200 else description
                })
        
        return sorted(destinations, key=lambda x: x['mentions'], reverse=True)
    
    def _get_accommodation_stats(self, hotels: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Thống kê chỗ ở"""
        if not hotels:
            return {}
        
        stats = {
            'total': len(hotels),
            'by_category': {},
            'by_type': {},
            'amenities': {}
        }
        
        for hotel in hotels:
            # Thống kê theo category
            category = hotel.get('category', 'Unknown')
            stats['by_category'][category] = stats['by_category'].get(category, 0) + 1
            
            # Thống kê theo type
            hotel_type = hotel.get('type', 'Unknown')
            stats['by_type'][hotel_type] = stats['by_type'].get(hotel_type, 0) + 1
            
            # Thống kê tiện nghi
            amenities = hotel.get('amenities', [])
            for amenity in amenities:
                stats['amenities'][amenity] = stats['amenities'].get(amenity, 0) + 1
        
        return stats