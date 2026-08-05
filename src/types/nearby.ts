// ============================================
// Nearby Places (from Overpass API)
// ============================================
export type POICategory =
  | 'river'
  | 'mountain'
  | 'bridge'
  | 'tunnel'
  | 'tourist'
  | 'city'
  | 'station';

export interface NearbyPlace {
  id: string;
  name: string;
  category: POICategory;
  lat: number;
  lng: number;
  distance: number; // km from train's current position
  description?: string;
  elevation?: number;
  tags: Record<string, string>; // raw OSM tags
}

export interface NearbyPlacesResult {
  places: NearbyPlace[];
  center: { lat: number; lng: number };
  radius: number; // meters
  updatedAt: string;
}
