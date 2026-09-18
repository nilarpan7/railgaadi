// ============================================
// API Configuration
// ============================================
export const API_BASE = '/api';

export const RAILRADAR_BASE = process.env.NEXT_PUBLIC_RAILRADAR_BASE || 'https://api.railradar.in/v1';
export const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || '';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================
// Cache Durations (milliseconds)
// ============================================
export const CACHE = {
  SEARCH: 5 * 60 * 1000,       // 5 minutes
  LIVE_STATUS: 10 * 1000,      // 10 seconds
  ROUTE: 60 * 60 * 1000,       // 1 hour
  WEATHER: 30 * 60 * 1000,     // 30 minutes
  ELEVATION: 60 * 60 * 1000,   // 1 hour
  NEARBY: 60 * 60 * 1000,      // 1 hour
} as const;

// ============================================
// Refresh Intervals (milliseconds)
// ============================================
export const REFRESH = {
  LIVE_STATUS: 15 * 1000,      // 15 seconds
  NEARBY: 60 * 1000,           // 60 seconds
} as const;

// ============================================
// Map Configuration
// ============================================
export const MAP = {
  CENTER: [78.9629, 20.5937] as [number, number], // Center of India
  ZOOM: 5,
  MAX_ZOOM: 18,
  MIN_ZOOM: 3,
  STYLE: {
    DARK: `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`,
    STREETS: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
    SATELLITE: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`,
  },
  ROUTE_COLORS: {
    COMPLETED: '#EA580C',       // Orange (accent)
    COMPLETED_GLOW: 'rgba(234, 88, 12, 0.3)',
    REMAINING: '#94A3B8',      // Gray
    REMAINING_DASH: [8, 4],
  },
  ANIMATION: {
    FLY_DURATION: 2000,        // ms for camera fly-to
    MARKER_TRANSITION: 1000,   // ms for marker movement
  },
} as const;

// ============================================
// Design Tokens
// ============================================
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

// ============================================
// Train Type Colors (for badges)
// ============================================
export const TRAIN_TYPE_COLORS: Record<string, string> = {
  Rajdhani: '#DC2626',
  Shatabdi: '#2563EB',
  Duronto: '#9333EA',
  'Vande Bharat': '#EA580C',
  'Garib Rath': '#059669',
  Humsafar: '#0D9488',
  SuperFast: '#4F46E5',
  Express: '#6B7280',
  Mail: '#6B7280',
  Local: '#6B7280',
};

// ============================================
// Navigation
// ============================================
export const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: 'Home' },
  { label: 'Track', href: '/tracking', icon: 'Train' },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { label: 'Saved', href: '/favorites', icon: 'Heart' },
] as const;

export const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/', icon: 'Home' },
  { label: 'Track', href: '/tracking', icon: 'Train' },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { label: 'Saved', href: '/favorites', icon: 'Heart' },
] as const;

// ============================================
// Search
// ============================================
export const SEARCH = {
  DEBOUNCE_MS: 300,
  MIN_QUERY_LENGTH: 2,
  MAX_RECENT: 10,
  MAX_SUGGESTIONS: 5,
} as const;

// ============================================
// Overpass API
// ============================================
export const OVERPASS = {
  BASE_URL: 'https://overpass-api.de/api/interpreter',
  DEFAULT_RADIUS: 5000, // meters
  TIMEOUT: 25, // seconds
} as const;
