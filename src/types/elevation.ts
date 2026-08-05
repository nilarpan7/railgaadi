// ============================================
// Elevation Profile
// ============================================
export interface ElevationPoint {
  distance: number; // km from source
  elevation: number; // meters above sea level
  lat: number;
  lng: number;
}

export interface ElevationProfile {
  points: ElevationPoint[];
  minElevation: number;
  maxElevation: number;
  averageElevation: number;
  totalAscent: number; // meters
  totalDescent: number; // meters
  highestPoint: ElevationPoint;
  lowestPoint: ElevationPoint;
}
