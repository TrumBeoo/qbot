# backend/services/google_maps_service.py
import os
import requests
import json
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class Location:
    lat: float
    lng: float
    
@dataclass
class PlaceResult:
    place_id: str
    name: str
    address: str
    location: Location
    rating: Optional[float] = None
    price_level: Optional[int] = None
    types: List[str] = None
    photos: List[str] = None
    opening_hours: Optional[Dict] = None

@dataclass
class RouteResult:
    distance: str
    duration: str
    start_address: str
    end_address: str
    steps: List[Dict]
    polyline: str

class GoogleMapsService:
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_MAPS_API_KEY', 'AIzaSyBWJuzurI2ZiWMyJBquuEVY3-Dt4puRxyo')
        self.base_url = 'https://maps.googleapis.com/maps/api'
        
    def _make_request(self, endpoint: str, params: Dict) -> Dict:
        """Make request to Google Maps API"""
        params['key'] = self.api_key
        url = f"{self.base_url}/{endpoint}"
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Check for API key restriction errors
            if data.get('status') == 'REQUEST_DENIED':
                error_msg = data.get('error_message', 'Request denied')
                if 'referer restrictions' in error_msg.lower():
                    logger.error(f"Google Maps API key has referer restrictions. Please configure the API key for server-side usage in Google Cloud Console.")
                    raise Exception("Google Maps API key is restricted for server-side usage. Please check API key configuration.")
                else:
                    logger.error(f"Google Maps API request denied: {error_msg}")
                    raise Exception(f"API request denied: {error_msg}")
            
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Google Maps API request failed: {e}")
            raise Exception(f"API request failed: {str(e)}")
    
    # Places API Methods
    def search_places(self, query: str, location: Optional[Location] = None, 
                     radius: int = 50000, language: str = 'vi') -> List[PlaceResult]:
        """Search for places using text query"""
        params = {
            'query': query,
            'language': language,
            'fields': 'place_id,name,formatted_address,geometry,rating,price_level,types,photos,opening_hours'
        }
        
        if location:
            params['location'] = f"{location.lat},{location.lng}"
            params['radius'] = radius
            
        try:
            data = self._make_request('place/textsearch/json', params)
            
            if data.get('status') != 'OK':
                logger.warning(f"Places search warning: {data.get('status')}")
                return []
                
            results = []
            for place in data.get('results', []):
                try:
                    location = Location(
                        lat=place['geometry']['location']['lat'],
                        lng=place['geometry']['location']['lng']
                    )
                    
                    photos = []
                    if 'photos' in place:
                        for photo in place['photos'][:3]:  # Limit to 3 photos
                            photo_url = f"{self.base_url}/place/photo?maxwidth=400&photoreference={photo['photo_reference']}&key={self.api_key}"
                            photos.append(photo_url)
                    
                    result = PlaceResult(
                        place_id=place.get('place_id', ''),
                        name=place.get('name', ''),
                        address=place.get('formatted_address', ''),
                        location=location,
                        rating=place.get('rating'),
                        price_level=place.get('price_level'),
                        types=place.get('types', []),
                        photos=photos,
                        opening_hours=place.get('opening_hours')
                    )
                    results.append(result)
                except KeyError as e:
                    logger.warning(f"Skipping place due to missing data: {e}")
                    continue
                    
            return results
            
        except Exception as e:
            logger.error(f"Places search failed: {e}")
            return []
    
    def search_nearby_places(self, location: Location, radius: int = 5000, 
                           place_type: Optional[str] = None, language: str = 'vi') -> List[PlaceResult]:
        """Search for nearby places"""
        params = {
            'location': f"{location.lat},{location.lng}",
            'radius': radius,
            'language': language,
            'fields': 'place_id,name,formatted_address,geometry,rating,price_level,types,photos'
        }
        
        if place_type:
            params['type'] = place_type
            
        try:
            data = self._make_request('place/nearbysearch/json', params)
            
            if data.get('status') != 'OK':
                logger.warning(f"Nearby search warning: {data.get('status')}")
                return []
                
            results = []
            for place in data.get('results', []):
                try:
                    place_location = Location(
                        lat=place['geometry']['location']['lat'],
                        lng=place['geometry']['location']['lng']
                    )
                    
                    photos = []
                    if 'photos' in place:
                        for photo in place['photos'][:3]:
                            photo_url = f"{self.base_url}/place/photo?maxwidth=400&photoreference={photo['photo_reference']}&key={self.api_key}"
                            photos.append(photo_url)
                    
                    result = PlaceResult(
                        place_id=place.get('place_id', ''),
                        name=place.get('name', ''),
                        address=place.get('formatted_address', ''),
                        location=place_location,
                        rating=place.get('rating'),
                        price_level=place.get('price_level'),
                        types=place.get('types', []),
                        photos=photos
                    )
                    results.append(result)
                except KeyError as e:
                    logger.warning(f"Skipping place due to missing data: {e}")
                    continue
                    
            return results
            
        except Exception as e:
            logger.error(f"Nearby search failed: {e}")
            return []
    
    def get_place_details(self, place_id: str, language: str = 'vi') -> Optional[Dict]:
        """Get detailed information about a place"""
        params = {
            'place_id': place_id,
            'language': language,
            'fields': 'name,formatted_address,geometry,rating,price_level,types,photos,opening_hours,formatted_phone_number,website,reviews,url'
        }
        
        try:
            data = self._make_request('place/details/json', params)
            
            if data.get('status') != 'OK':
                logger.warning(f"Place details warning: {data.get('status')}")
                return None
                
            return data.get('result')
            
        except Exception as e:
            logger.error(f"Place details failed: {e}")
            return None
    
    def autocomplete_places(self, input_text: str, location: Optional[Location] = None,
                          radius: int = 50000, language: str = 'vi') -> List[Dict]:
        """Get place autocomplete predictions"""
        params = {
            'input': input_text,
            'language': language,
            'components': 'country:vn'  # Restrict to Vietnam
        }
        
        if location:
            params['location'] = f"{location.lat},{location.lng}"
            params['radius'] = radius
            
        try:
            data = self._make_request('place/autocomplete/json', params)
            
            if data.get('status') != 'OK':
                logger.warning(f"Autocomplete warning: {data.get('status')}")
                return []
                
            return data.get('predictions', [])
            
        except Exception as e:
            logger.error(f"Autocomplete failed: {e}")
            return []
    
    # Directions API Methods
    def get_directions(self, origin: str, destination: str, mode: str = 'driving',
                      language: str = 'vi', alternatives: bool = True) -> Optional[RouteResult]:
        """Get directions between two points"""
        params = {
            'origin': origin,
            'destination': destination,
            'mode': mode,
            'language': language,
            'alternatives': alternatives,
            'units': 'metric'
        }
        
        try:
            data = self._make_request('directions/json', params)
            
            if data.get('status') != 'OK':
                logger.warning(f"Directions warning: {data.get('status')}")
                return None
                
            routes = data.get('routes', [])
            if not routes:
                return None
                
            route = routes[0]  # Get first route
            leg = route['legs'][0]  # Get first leg
            
            return RouteResult(
                distance=leg['distance']['text'],
                duration=leg['duration']['text'],
                start_address=leg['start_address'],
                end_address=leg['end_address'],
                steps=leg['steps'],
                polyline=route['overview_polyline']['points']
            )
            
        except Exception as e:
            logger.error(f"Directions failed: {e}")
            return None
    
    def get_multiple_routes(self, origin: str, destination: str, language: str = 'vi') -> List[RouteResult]:
        """Get routes for different travel modes"""
        modes = ['driving', 'walking', 'bicycling', 'transit']
        results = []
        
        for mode in modes:
            try:
                route = self.get_directions(origin, destination, mode, language)
                if route:
                    results.append({
                        'mode': mode,
                        'route': route
                    })
            except Exception as e:
                logger.warning(f"Failed to get {mode} route: {e}")
                continue
                
        return results
    
    # Distance Matrix API Methods
    def calculate_distance_matrix(self, origins: List[str], destinations: List[str],
                                mode: str = 'driving', language: str = 'vi') -> Optional[Dict]:
        """Calculate distance matrix between multiple origins and destinations"""
        params = {
            'origins': '|'.join(origins),
            'destinations': '|'.join(destinations),
            'mode': mode,
            'language': language,
            'units': 'metric'
        }
        
        try:
            data = self._make_request('distancematrix/json', params)
            
            if data.get('status') != 'OK':
                logger.warning(f"Distance matrix warning: {data.get('status')}")
                return None
                
            return data
            
        except Exception as e:
            logger.error(f"Distance matrix failed: {e}")
            return None
    
    def find_nearest_places(self, user_location: Location, places: List[PlaceResult]) -> List[Dict]:
        """Find nearest places to user location using Distance Matrix API"""
        if not places:
            return []
            
        origins = [f"{user_location.lat},{user_location.lng}"]
        destinations = [f"{place.location.lat},{place.location.lng}" for place in places]
        
        try:
            matrix_data = self.calculate_distance_matrix(origins, destinations)
            
            if not matrix_data or not matrix_data.get('rows'):
                return []
                
            elements = matrix_data['rows'][0]['elements']
            results = []
            
            for i, element in enumerate(elements):
                if element.get('status') == 'OK' and i < len(places):
                    results.append({
                        'place': places[i],
                        'distance': element['distance']['text'],
                        'duration': element['duration']['text'],
                        'distance_value': element['distance']['value'],
                        'duration_value': element['duration']['value']
                    })
            
            # Sort by distance
            results.sort(key=lambda x: x['distance_value'])
            return results
            
        except Exception as e:
            logger.error(f"Find nearest places failed: {e}")
            return []
    
    # Geocoding API Methods
    def geocode_address(self, address: str, language: str = 'vi') -> Optional[Location]:
        """Convert address to coordinates"""
        params = {
            'address': address,
            'language': language
        }
        
        try:
            data = self._make_request('geocode/json', params)
            
            if data.get('status') != 'OK':
                logger.warning(f"Geocoding warning: {data.get('status')}")
                return None
                
            results = data.get('results', [])
            if not results:
                return None
                
            location = results[0]['geometry']['location']
            return Location(lat=location['lat'], lng=location['lng'])
            
        except Exception as e:
            logger.error(f"Geocoding failed: {e}")
            return None
    
    def reverse_geocode(self, location: Location, language: str = 'vi') -> Optional[str]:
        """Convert coordinates to address"""
        params = {
            'latlng': f"{location.lat},{location.lng}",
            'language': language
        }
        
        try:
            data = self._make_request('geocode/json', params)
            
            if data.get('status') != 'OK':
                logger.warning(f"Reverse geocoding warning: {data.get('status')}")
                return None
                
            results = data.get('results', [])
            if not results:
                return None
                
            return results[0]['formatted_address']
            
        except Exception as e:
            logger.error(f"Reverse geocoding failed: {e}")
            return None
    
    # Utility Methods
    def get_popular_vietnam_locations(self) -> List[Dict]:
        """Get popular locations in Vietnam"""
        return [
            {'name': 'Hà Nội', 'location': Location(21.0285, 105.8542)},
            {'name': 'TP. Hồ Chí Minh', 'location': Location(10.8231, 106.6297)},
            {'name': 'Đà Nẵng', 'location': Location(16.0471, 108.2068)},
            {'name': 'Hạ Long', 'location': Location(20.9101, 107.1839)},
            {'name': 'Sapa', 'location': Location(22.3380, 103.8442)},
            {'name': 'Đà Lạt', 'location': Location(11.9404, 108.4583)},
            {'name': 'Nha Trang', 'location': Location(12.2388, 109.1967)},
            {'name': 'Hội An', 'location': Location(15.8801, 108.3380)},
            {'name': 'Huế', 'location': Location(16.4637, 107.5909)},
            {'name': 'Phú Quốc', 'location': Location(10.2899, 103.9840)}
        ]
    
    def format_place_for_response(self, place: PlaceResult) -> Dict:
        """Format place data for API response"""
        return {
            'place_id': place.place_id,
            'name': place.name,
            'address': place.address,
            'location': {
                'lat': place.location.lat,
                'lng': place.location.lng
            },
            'rating': place.rating,
            'price_level': place.price_level,
            'types': place.types,
            'photos': place.photos,
            'opening_hours': place.opening_hours
        }

# Create singleton instance
google_maps_service = GoogleMapsService()