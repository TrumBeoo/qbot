# backend/services/maps_api.py
from flask import Blueprint, request, jsonify
from .google_maps_service import google_maps_service, Location
import logging

logger = logging.getLogger(__name__)

maps_bp = Blueprint('maps', __name__, url_prefix='/api/maps')

@maps_bp.route('/search', methods=['POST'])
def search_places():
    """Search for places"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        # Optional location filter
        location = None
        if 'location' in data:
            loc_data = data['location']
            location = Location(lat=loc_data['lat'], lng=loc_data['lng'])
        
        radius = data.get('radius', 50000)
        language = data.get('language', 'vi')
        
        results = google_maps_service.search_places(
            query=query,
            location=location,
            radius=radius,
            language=language
        )
        
        formatted_results = [
            google_maps_service.format_place_for_response(place)
            for place in results
        ]
        
        return jsonify({
            'success': True,
            'results': formatted_results,
            'count': len(formatted_results)
        })
        
    except Exception as e:
        logger.error(f"Search places error: {e}")
        error_message = str(e)
        
        # Provide more specific error messages for common issues
        if 'restricted for server-side usage' in error_message:
            return jsonify({
                'error': 'Google Maps API configuration error',
                'message': 'The API key needs to be configured for server-side usage. Please check the Google Cloud Console settings.',
                'details': error_message
            }), 500
        elif 'API request denied' in error_message:
            return jsonify({
                'error': 'Google Maps API access denied',
                'message': 'There is an issue with the API key configuration.',
                'details': error_message
            }), 500
        else:
            return jsonify({
                'error': 'Search failed',
                'message': 'Unable to search for places at this time.',
                'details': error_message
            }), 500

@maps_bp.route('/nearby', methods=['POST'])
def search_nearby():
    """Search for nearby places"""
    try:
        data = request.get_json()
        
        if 'location' not in data:
            return jsonify({'error': 'Location is required'}), 400
        
        loc_data = data['location']
        location = Location(lat=loc_data['lat'], lng=loc_data['lng'])
        
        radius = data.get('radius', 5000)
        place_type = data.get('type')
        language = data.get('language', 'vi')
        
        results = google_maps_service.search_nearby_places(
            location=location,
            radius=radius,
            place_type=place_type,
            language=language
        )
        
        formatted_results = [
            google_maps_service.format_place_for_response(place)
            for place in results
        ]
        
        return jsonify({
            'success': True,
            'results': formatted_results,
            'count': len(formatted_results)
        })
        
    except Exception as e:
        logger.error(f"Search nearby error: {e}")
        return jsonify({'error': str(e)}), 500

@maps_bp.route('/place/<place_id>', methods=['GET'])
def get_place_details(place_id):
    """Get detailed information about a place"""
    try:
        language = request.args.get('language', 'vi')
        
        result = google_maps_service.get_place_details(
            place_id=place_id,
            language=language
        )
        
        if not result:
            return jsonify({'error': 'Place not found'}), 404
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        logger.error(f"Get place details error: {e}")
        return jsonify({'error': str(e)}), 500

@maps_bp.route('/autocomplete', methods=['POST'])
def autocomplete():
    """Get place autocomplete predictions"""
    try:
        data = request.get_json()
        input_text = data.get('input', '')
        
        if not input_text:
            return jsonify({'error': 'Input is required'}), 400
        
        # Optional location bias
        location = None
        if 'location' in data:
            loc_data = data['location']
            location = Location(lat=loc_data['lat'], lng=loc_data['lng'])
        
        radius = data.get('radius', 50000)
        language = data.get('language', 'vi')
        
        results = google_maps_service.autocomplete_places(
            input_text=input_text,
            location=location,
            radius=radius,
            language=language
        )
        
        return jsonify({
            'success': True,
            'predictions': results
        })
        
    except Exception as e:
        logger.error(f"Autocomplete error: {e}")
        return jsonify({'error': str(e)}), 500

@maps_bp.route('/directions', methods=['POST'])
def get_directions():
    """Get directions between two points"""
    try:
        data = request.get_json()
        origin = data.get('origin', '')
        destination = data.get('destination', '')
        
        if not origin or not destination:
            return jsonify({'error': 'Origin and destination are required'}), 400
        
        mode = data.get('mode', 'driving')
        language = data.get('language', 'vi')
        
        result = google_maps_service.get_directions(
            origin=origin,
            destination=destination,
            mode=mode,
            language=language
        )
        
        if not result:
            return jsonify({'error': 'No route found'}), 404
        
        return jsonify({
            'success': True,
            'route': {
                'distance': result.distance,
                'duration': result.duration,
                'start_address': result.start_address,
                'end_address': result.end_address,
                'steps': result.steps,
                'polyline': result.polyline
            }
        })
        
    except Exception as e:
        logger.error(f"Get directions error: {e}")
        return jsonify({'error': str(e)}), 500

@maps_bp.route('/directions/multiple', methods=['POST'])
def get_multiple_routes():
    """Get routes for different travel modes"""
    try:
        data = request.get_json()
        origin = data.get('origin', '')
        destination = data.get('destination', '')
        
        if not origin or not destination:
            return jsonify({'error': 'Origin and destination are required'}), 400
        
        language = data.get('language', 'vi')
        
        results = google_maps_service.get_multiple_routes(
            origin=origin,
            destination=destination,
            language=language
        )
        
        formatted_results = []
        for result in results:
            route = result['route']
            formatted_results.append({
                'mode': result['mode'],
                'distance': route.distance,
                'duration': route.duration,
                'start_address': route.start_address,
                'end_address': route.end_address,
                'polyline': route.polyline
            })
        
        return jsonify({
            'success': True,
            'routes': formatted_results
        })
        
    except Exception as e:
        logger.error(f"Get multiple routes error: {e}")
        return jsonify({'error': str(e)}), 500

@maps_bp.route('/distance-matrix', methods=['POST'])
def calculate_distance_matrix():
    """Calculate distance matrix between multiple points"""
    try:
        data = request.get_json()
        origins = data.get('origins', [])
        destinations = data.get('destinations', [])
        
        if not origins or not destinations:
            return jsonify({'error': 'Origins and destinations are required'}), 400
        
        mode = data.get('mode', 'driving')
        language = data.get('language', 'vi')
        
        result = google_maps_service.calculate_distance_matrix(
            origins=origins,
            destinations=destinations,
            mode=mode,
            language=language
        )
        
        if not result:
            return jsonify({'error': 'Distance matrix calculation failed'}), 500
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        logger.error(f"Distance matrix error: {e}")
        return jsonify({'error': str(e)}), 500

@maps_bp.route('/nearest', methods=['POST'])
def find_nearest():
    """Find nearest places to user location"""
    try:
        data = request.get_json()
        
        if 'user_location' not in data:
            return jsonify({'error': 'User location is required'}), 400
        
        user_loc = data['user_location']
        user_location = Location(lat=user_loc['lat'], lng=user_loc['lng'])
        
        query = data.get('query', '')
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        # First search for places
        places = google_maps_service.search_places(
            query=query,
            location=user_location,
            radius=data.get('radius', 50000)
        )
        
        if not places:
            return jsonify({
                'success': True,
                'results': [],
                'message': 'No places found'
            })
        
        # Find nearest places
        nearest_results = google_maps_service.find_nearest_places(
            user_location=user_location,
            places=places
        )
        
        formatted_results = []
        for result in nearest_results:
            place_data = google_maps_service.format_place_for_response(result['place'])
            place_data.update({
                'distance': result['distance'],
                'duration': result['duration'],
                'distance_value': result['distance_value'],
                'duration_value': result['duration_value']
            })
            formatted_results.append(place_data)
        
        return jsonify({
            'success': True,
            'results': formatted_results,
            'count': len(formatted_results)
        })
        
    except Exception as e:
        logger.error(f"Find nearest error: {e}")
        return jsonify({'error': str(e)}), 500

@maps_bp.route('/geocode', methods=['POST'])
def geocode():
    """Convert address to coordinates"""
    try:
        data = request.get_json()
        address = data.get('address', '')
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        language = data.get('language', 'vi')
        
        location = google_maps_service.geocode_address(
            address=address,
            language=language
        )
        
        if not location:
            return jsonify({'error': 'Address not found'}), 404
        
        return jsonify({
            'success': True,
            'location': {
                'lat': location.lat,
                'lng': location.lng
            }
        })
        
    except Exception as e:
        logger.error(f"Geocode error: {e}")
        return jsonify({'error': str(e)}), 500

@maps_bp.route('/reverse-geocode', methods=['POST'])
def reverse_geocode():
    """Convert coordinates to address"""
    try:
        data = request.get_json()
        
        if 'location' not in data:
            return jsonify({'error': 'Location is required'}), 400
        
        loc_data = data['location']
        location = Location(lat=loc_data['lat'], lng=loc_data['lng'])
        language = data.get('language', 'vi')
        
        address = google_maps_service.reverse_geocode(
            location=location,
            language=language
        )
        
        if not address:
            return jsonify({'error': 'Address not found'}), 404
        
        return jsonify({
            'success': True,
            'address': address
        })
        
    except Exception as e:
        logger.error(f"Reverse geocode error: {e}")
        return jsonify({'error': str(e)}), 500

@maps_bp.route('/popular-locations', methods=['GET'])
def get_popular_locations():
    """Get popular locations in Vietnam"""
    try:
        locations = google_maps_service.get_popular_vietnam_locations()
        
        formatted_locations = []
        for loc in locations:
            formatted_locations.append({
                'name': loc['name'],
                'location': {
                    'lat': loc['location'].lat,
                    'lng': loc['location'].lng
                }
            })
        
        return jsonify({
            'success': True,
            'locations': formatted_locations
        })
        
    except Exception as e:
        logger.error(f"Get popular locations error: {e}")
        return jsonify({'error': str(e)}), 500

# Error handlers
@maps_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@maps_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@maps_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500