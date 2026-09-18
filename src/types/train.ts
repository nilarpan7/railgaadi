// ============================================
// Station
// ============================================
export interface Station {
  code: string;
  name: string;
  lat: number;
  lng: number;
  state?: string;
  zone?: string;
}

// ============================================
// Train
// ============================================
export type TrainType =
  | 'Rajdhani'
  | 'Shatabdi'
  | 'Duronto'
  | 'Vande Bharat'
  | 'SuperFast'
  | 'Express'
  | 'Mail'
  | 'Local'
  | 'Garib Rath'
  | 'Humsafar';

export interface Train {
  id: string;
  number: string;
  name: string;
  source: Station;
  destination: Station;
  type: TrainType;
  days: string[]; // ['Mon', 'Wed', 'Fri', 'Sun']
  departureTime: string; // "06:00"
  arrivalTime: string; // "22:30"
  duration: string; // "16h 30m"
  totalDistance: number; // km
  numberOfStops: number;
}

// ============================================
// Station Status (within a journey)
// ============================================
export interface StationStatus {
  station: Station;
  scheduledArrival: string | null; // ISO or "HH:mm"
  scheduledDeparture: string | null;
  actualArrival: string | null;
  actualDeparture: string | null;
  delay: number; // minutes (negative = early)
  platform: number | null;
  distanceFromSource: number; // km
  haltTime: number; // minutes
  status: 'visited' | 'current' | 'upcoming' | 'skipped';
  day: number; // Day 1, Day 2, etc. for multi-day journeys
}

// ============================================
// Live Status
// ============================================
export type TrainStatus =
  | 'running'
  | 'not-started'
  | 'completed'
  | 'cancelled'
  | 'delayed'
  | 'rescheduled';

export interface LiveStatus {
  trainNumber: string;
  trainName: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
  speed: number; // km/h
  delay: number; // minutes, negative = early
  currentStation: Station;
  nextStation: Station;
  previousStation: Station;
  lastStation: Station; // final destination
  eta: string; // ISO timestamp for final destination
  nextStationEta: string; // ISO timestamp for next station
  progress: number; // 0–100
  distanceCovered: number; // km
  distanceRemaining: number; // km
  totalDistance: number; // km
  status: TrainStatus;
  updatedAt: string; // ISO timestamp
  stationStatuses: StationStatus[];
  currentPlatform: number | null;
  /**
   * Where this payload came from. `'demo'` means the upstream call failed and
   * the response is generated sample data — the UI must say so rather than
   * present it as a real running train.
   */
  dataSource?: 'live' | 'demo';
}
