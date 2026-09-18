import type { Station } from './train';

// ============================================
// Route Data (GeoJSON)
// ============================================
export interface RouteData {
  polyline: GeoJSON.Feature<GeoJSON.LineString>;
  stations: RouteStation[];
  totalDistance: number; // km
  /** `'demo'` means the geometry is a synthesized fallback, not the real track. */
  dataSource?: 'live' | 'demo';
}

export interface RouteStation {
  station: Station;
  distanceFromSource: number; // km
  positionOnLine: number; // 0–1 fraction along the polyline
}

// ============================================
// Computed Journey Route (with split polylines)
// ============================================
export interface JourneyRoute extends RouteData {
  completedPolyline: GeoJSON.Feature<GeoJSON.LineString>;
  remainingPolyline: GeoJSON.Feature<GeoJSON.LineString>;
  trainPosition: [number, number]; // [lng, lat]
  trainBearing: number; // degrees
}
