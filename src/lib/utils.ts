import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Indian Railways runs on IST. Pinning the zone keeps server-rendered markup
 * byte-identical to the client's first render — an unpinned `toLocale*` call
 * formats in UTC on the server and in the visitor's zone in the browser, which
 * React reports as a hydration mismatch.
 */
const IST = 'Asia/Kolkata';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format delay in minutes to human-readable string
 * @example formatDelay(0) → "On Time"
 * @example formatDelay(15) → "+15 min late"
 * @example formatDelay(-5) → "5 min early"
 */
export function formatDelay(minutes: number): string {
  if (minutes === 0) return 'On Time';
  if (minutes > 0) return `+${minutes} min late`;
  return `${Math.abs(minutes)} min early`;
}

/**
 * Get status color class based on delay
 */
export function getDelayColor(minutes: number): string {
  if (minutes <= 0) return 'text-green-600 dark:text-green-400';
  if (minutes <= 10) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get background color class for delay badges
 */
export function getDelayBgColor(minutes: number): string {
  if (minutes <= 0) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (minutes <= 10) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'delayed':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'not-started':
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400';
  }
}

/**
 * Get train type color for badges
 */
export function getTrainTypeColor(type: string): string {
  switch (type) {
    case 'Rajdhani':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'Shatabdi':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Duronto':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'Vande Bharat':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'Garib Rath':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'Humsafar':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
    case 'SuperFast':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400';
  }
}

/**
 * Format distance in km
 * @example formatDistance(1234) → "1,234 km"
 * @example formatDistance(0.5) → "0.5 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString('en-IN')} km`;
}

/**
 * Format time string
 * @example formatTime("14:30") → "2:30 PM"
 */
export function formatTime(time: string): string {
  if (!time) return '--:--';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format ISO timestamp to relative time
 * @example formatRelativeTime(isoString) → "2 min ago"
 */
export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString('en-IN', { timeZone: IST });
}

/**
 * Format duration string
 * @example formatDuration(390) → "6h 30m"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Calculate journey progress percentage
 */
export function calculateProgress(distanceCovered: number, totalDistance: number): number {
  if (totalDistance <= 0) return 0;
  return Math.min(100, Math.max(0, (distanceCovered / totalDistance) * 100));
}

/**
 * Format speed
 */
export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

/**
 * Get weather emoji from OWM icon code
 */
export function getWeatherEmoji(icon: string): string {
  const map: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return map[icon] || '🌤️';
}

/**
 * Get POI category emoji
 */
export function getPOIEmoji(category: string): string {
  const map: Record<string, string> = {
    river: '🏞️',
    mountain: '⛰️',
    bridge: '🌉',
    tunnel: '🚇',
    tourist: '📸',
    city: '🏙️',
    station: '🚉',
  };
  return map[category] || '📍';
}
