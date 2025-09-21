import { Loader } from '@googlemaps/js-api-loader';

class GoogleMapsService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    this.loader = null;
    this.isLoaded = false;
    this.map = null;
    this.services = {};
    this.cache = new Map();
    this.loadPromise = null;
  }

  async initialize() {
    if (this.isLoaded) return true;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this._loadApi();
    return this.loadPromise;
  }

  async _loadApi() {
    try {
      this.loader = new Loader({
        apiKey: this.apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry']
      });

      await this.loader.load();
      this.isLoaded = true;
      this._initServices();
      return true;
    } catch (error) {
      console.error('Google Maps API load failed:', error);
      this.loadPromise = null;
      throw error;
    }
  }

  _initServices() {
    this.services = {
      directions: new google.maps.DirectionsService(),
      distanceMatrix: new google.maps.DistanceMatrixService(),
      geocoder: new google.maps.Geocoder(),
      autocomplete: new google.maps.places.AutocompleteService()
    };
  }

  createMap(element, options = {}) {
    if (!this.isLoaded) throw new Error('Google Maps API not loaded');

    const defaultOptions = {
      zoom: 10,
      center: { lat: 20.9101, lng: 107.1839 }, // Quảng Ninh
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      gestureHandling: 'cooperative',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    };

    this.map = new google.maps.Map(element, { ...defaultOptions, ...options });
    this.services.places = new google.maps.places.PlacesService(this.map);
    return this.map;
  }

  async searchPlaces(query, options = {}) {
    const cacheKey = `search_${query}_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    return new Promise((resolve, reject) => {
      if (!this.services.places) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request = {
        query,
        fields: ['name', 'geometry', 'formatted_address', 'rating', 'photos', 'place_id', 'types'],
        ...options
      };

      this.services.places.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          this.cache.set(cacheKey, results);
          resolve(results);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  async searchNearbyPlaces(location, radius = 5000, type = null) {
    const cacheKey = `nearby_${location.lat}_${location.lng}_${radius}_${type}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    return new Promise((resolve, reject) => {
      if (!this.services.places) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request = {
        location,
        radius,
        fields: ['name', 'geometry', 'formatted_address', 'rating', 'photos', 'place_id', 'types']
      };

      if (type) request.type = type;

      this.services.places.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          this.cache.set(cacheKey, results);
          resolve(results);
        } else {
          reject(new Error(`Nearby search failed: ${status}`));
        }
      });
    });
  }

  async getPlaceDetails(placeId) {
    if (this.cache.has(placeId)) return this.cache.get(placeId);

    return new Promise((resolve, reject) => {
      if (!this.services.places) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request = {
        placeId,
        fields: ['name', 'geometry', 'formatted_address', 'rating', 'photos', 'types', 'opening_hours', 'website', 'formatted_phone_number']
      };

      this.services.places.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          this.cache.set(placeId, place);
          resolve(place);
        } else {
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    });
  }

  async getAutocompletePredictions(input, options = {}) {
    if (!input.trim()) return [];
    
    return new Promise((resolve, reject) => {
      if (!this.services.autocomplete) {
        reject(new Error('Autocomplete service not initialized'));
        return;
      }

      const request = {
        input,
        componentRestrictions: { country: 'vn' },
        ...options
      };

      this.services.autocomplete.getPlacePredictions(request, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(predictions || []);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Autocomplete failed: ${status}`));
        }
      });
    });
  }

  async calculateRoute(origin, destination, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.services.directions) {
        reject(new Error('Directions service not initialized'));
        return;
      }

      const request = {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        ...options
      };

      this.services.directions.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          resolve(result);
        } else {
          reject(new Error(`Directions failed: ${status}`));
        }
      });
    });
  }

  async calculateMultipleRoutes(origin, destination) {
    const modes = [google.maps.TravelMode.DRIVING, google.maps.TravelMode.WALKING];
    const results = await Promise.allSettled(
      modes.map(mode => this.calculateRoute(origin, destination, { travelMode: mode }))
    );
    return results.filter(r => r.status === 'fulfilled').map(r => r.value);
  }

  async calculateDistanceMatrix(origins, destinations, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.services.distanceMatrix) {
        reject(new Error('Distance Matrix service not initialized'));
        return;
      }

      const request = {
        origins,
        destinations,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        ...options
      };

      this.services.distanceMatrix.getDistanceMatrix(request, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK) {
          resolve(response);
        } else {
          reject(new Error(`Distance Matrix failed: ${status}`));
        }
      });
    });
  }

  async geocodeAddress(address) {
    if (this.cache.has(address)) return this.cache.get(address);

    return new Promise((resolve, reject) => {
      if (!this.services.geocoder) {
        reject(new Error('Geocoder not initialized'));
        return;
      }

      this.services.geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          this.cache.set(address, results);
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  async reverseGeocode(location) {
    const key = `${location.lat}_${location.lng}`;
    if (this.cache.has(key)) return this.cache.get(key);

    return new Promise((resolve, reject) => {
      if (!this.services.geocoder) {
        reject(new Error('Geocoder not initialized'));
        return;
      }

      this.services.geocoder.geocode({ location }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          this.cache.set(key, results);
          resolve(results);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }

  async getCurrentPosition(options = {}) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    return new Promise((resolve, reject) => {
      const opts = {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000,
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }),
        err => {
          const messages = {
            1: 'Permission denied',
            2: 'Position unavailable', 
            3: 'Timeout'
          };
          reject(new Error(messages[err.code] || 'Geolocation error'));
        },
        opts
      );
    });
  }

  calculateDistance(point1, point2) {
    if (!this.isLoaded) return null;
    return google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(point1.lat, point1.lng),
      new google.maps.LatLng(point2.lat, point2.lng)
    );
  }

  findNearestPlaces(userLocation, places, limit = 5) {
    return places
      .map(place => ({
        ...place,
        distance: this.calculateDistance(userLocation, place.geometry.location)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }

  createMarker(position, options = {}) {
    if (!this.map) return null;
    return new google.maps.Marker({
      position,
      map: this.map,
      animation: google.maps.Animation.DROP,
      ...options
    });
  }

  createInfoWindow(content, options = {}) {
    return new google.maps.InfoWindow({
      content,
      maxWidth: 300,
      ...options
    });
  }

  fitBounds(bounds) {
    if (this.map && bounds) this.map.fitBounds(bounds);
  }

  createBounds(locations) {
    const bounds = new google.maps.LatLngBounds();
    locations.forEach(loc => bounds.extend(loc));
    return bounds;
  }

  clearCache() {
    this.cache.clear();
  }

  getMap() { return this.map; }
  isApiLoaded() { return this.isLoaded; }
}

export const googleMapsService = new GoogleMapsService();
export default googleMapsService;