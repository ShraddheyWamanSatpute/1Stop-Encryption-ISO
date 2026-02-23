import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Car, 
  Clock,
  Phone,
  Globe
} from 'lucide-react';

// Google Maps type declarations
declare global {
  namespace google {
    namespace maps {
      class Map {
        constructor(element: HTMLElement, options?: any);
        setCenter(center: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
      }
      class Marker {
        constructor(options?: any);
        setPosition(position: LatLng | LatLngLiteral): void;
        setMap(map: Map | null): void;
      }
      class InfoWindow {
        constructor(options?: any);
        setContent(content: string): void;
        open(map: Map, marker?: Marker): void;
        close(): void;
      }
      interface LatLng {
        lat(): number;
        lng(): number;
      }
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
    }
  }
}

interface RestaurantMapProps {
  restaurant: {
    name: string;
    address: string;
    phone?: string;
    website?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export function RestaurantMap({ restaurant }: RestaurantMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const infoWindowInstanceRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [directionsUrl, setDirectionsUrl] = useState('');

  useEffect(() => {
    if (restaurant.location) {
      setDirectionsUrl(
        `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`
      );
    } else {
      setDirectionsUrl(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`
      );
    }
  }, [restaurant]);

  useEffect(() => {
    // Check if Google Maps API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_places_api_key_here') {
      console.warn('Google Maps API key not configured, using fallback map');
      setMapLoaded(true);
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      // Use setTimeout to ensure the map container is ready
      setTimeout(() => initMap(), 100);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script is already loading, wait for it
      const checkGoogle = () => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
          setTimeout(() => initMap(), 100);
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
      return;
    }

    // Load Google Maps script only if not already present
    if (!window.google && mapRef.current) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Check if Maps API is properly loaded and available
        if (window.google && window.google.maps && window.google.maps.Map) {
          setMapLoaded(true);
          setTimeout(() => initMap(), 100);
        } else {
          console.warn('Google Maps JavaScript API not properly loaded or not activated');
          setMapLoaded(true);
        }
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps JavaScript API');
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || !restaurant.location) return;

    // Check if Google Maps is available and properly loaded
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.warn('Google Maps JavaScript API not available, showing fallback map');
      return;
    }

    try {
      // Clean up existing map instances
      cleanupMap();

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: {
          lat: restaurant.location.lat,
          lng: restaurant.location.lng
        },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      const marker = new window.google.maps.Marker({
        position: {
          lat: restaurant.location.lat,
          lng: restaurant.location.lng
        },
        map: map,
        title: restaurant.name,
        animation: window.google.maps.Animation.DROP
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold;">${restaurant.name}</h3>
            <p style="margin: 0; font-size: 14px; color: #666;">${restaurant.address}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Store references for cleanup
      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
      infoWindowInstanceRef.current = infoWindow;

      // Open info window by default
      infoWindow.open(map, marker);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      // The component will show the fallback map UI
    }
  };

  const cleanupMap = () => {
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setMap(null);
      markerInstanceRef.current = null;
    }
    if (infoWindowInstanceRef.current) {
      infoWindowInstanceRef.current.close();
      infoWindowInstanceRef.current = null;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }
  };

  const openGoogleMaps = () => {
    window.open(directionsUrl, '_blank');
  };

  const getEstimatedTravelTime = () => {
    // Mock travel time calculation
    return {
      walking: '8 min',
      driving: '3 min',
      transit: '12 min'
    };
  };

  const travelTimes = getEstimatedTravelTime();

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <div 
              ref={mapRef} 
              className="w-full h-64 bg-gray-100 rounded-b-lg"
              style={{ minHeight: '256px' }}
            >
              {!mapLoaded && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Loading map...</p>
                  </div>
                </div>
              )}
              {mapLoaded && (!window.google || !window.google.maps || !window.google.maps.Map) && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium">Interactive Map Not Available</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Open in Maps" to view location</p>
                    <p className="text-xs text-gray-400 mt-1">Google Maps JavaScript API not activated</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Map Overlay Actions */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                size="sm"
                onClick={openGoogleMaps}
                className="bg-white hover:bg-gray-50 text-gray-700 shadow-md"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open in Maps
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Details */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
              <p className="text-gray-600">{restaurant.address}</p>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {restaurant.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a 
                    href={`tel:${restaurant.phone}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {restaurant.phone}
                  </a>
                </div>
              )}
              {restaurant.website && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a 
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors flex items-center gap-1"
                  >
                    Visit Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Travel Times */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Estimated Travel Time</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Navigation className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{travelTimes.walking}</div>
                  <div className="text-xs text-gray-500">Walking</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Car className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{travelTimes.driving}</div>
                  <div className="text-xs text-gray-500">Driving</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{travelTimes.transit}</div>
                  <div className="text-xs text-gray-500">Transit</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button onClick={openGoogleMaps} className="flex-1">
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
              <Button variant="outline" className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                Call Restaurant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
