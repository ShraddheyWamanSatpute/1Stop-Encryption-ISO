// Google Maps type definitions
declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleMaps {
  maps: {
    Map: any;
    Marker: any;
    InfoWindow: any;
    LatLng: any;
    LatLngBounds: any;
    MapTypeId: any;
    places: {
      PlacesService: any;
      PlacesServiceStatus: any;
      AutocompleteService: any;
      PlacesAutocomplete: any;
    };
  };
}

export interface GoogleMapsMarker {
  setPosition(position: any): void;
  setMap(map: any): void;
  addListener(event: string, callback: () => void): void;
}

export interface GoogleMapsMap {
  setCenter(center: any): void;
  setZoom(zoom: number): void;
  getBounds(): any;
  fitBounds(bounds: any): void;
}

export interface GoogleMapsInfoWindow {
  setContent(content: string): void;
  open(map: any, marker: any): void;
  close(): void;
}
