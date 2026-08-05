// ============================================
// Weather Data
// ============================================
export interface WeatherData {
  stationName: string;
  stationCode: string;
  temperature: number; // °C
  feelsLike: number; // °C
  humidity: number; // %
  windSpeed: number; // m/s
  windDirection: number; // degrees
  pressure: number; // hPa
  visibility: number; // meters
  clouds: number; // %
  rainChance: number; // 0–100 (computed from rain/clouds)
  description: string; // "Partly cloudy"
  icon: string; // OWM icon code "01d"
  main: string; // "Clouds", "Rain", "Clear"
  sunrise: string; // ISO
  sunset: string; // ISO
  updatedAt: string; // ISO
}

// Context labels for weather cards
export type WeatherContext = 'current' | 'next' | 'destination';
