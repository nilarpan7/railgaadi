import { NextResponse } from 'next/server';
import { resolveApiKey } from '@/services/railradar';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasRailRadar = Boolean(resolveApiKey(null));
  const hasMapTiler = Boolean(
    (process.env.NEXT_PUBLIC_MAPTILER_KEY || process.env.MAPTILER_KEY || '').trim()
  );
  const hasWeather = Boolean(
    (process.env.OPENWEATHER_API_KEY || '').trim()
  );

  return NextResponse.json({
    railradar: hasRailRadar,
    maptiler: hasMapTiler,
    weather: hasWeather,
  });
}
