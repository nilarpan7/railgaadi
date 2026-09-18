'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as maplibregl from 'maplibre-gl';
import along from '@turf/along';
import bearing from '@turf/bearing';
import length from '@turf/length';
import {
  Gauge,
  Maximize2,
  Minimize2,
  Radio,
  Clock,
  Navigation,
  MapPin,
} from 'lucide-react';
import {
  cn,
  formatDelay,
  formatDistance,
  formatTime,
  getDelayColor,
} from '@/lib/utils';
import { Button } from '@/components/ui';
import type { LiveStatus } from '@/types/train';
import type { RouteData } from '@/types/route';
import { useThemeStore } from '@/store/theme';
import { FloatingControls, type MapStyleMode } from './floating-controls';
import { useMapCamera } from '../hooks/useMapCamera';
import {
  createStationMarker,
  createTrainMarker,
  stationPopupHTML,
  type StationMarkerHandle,
  type TrainMarkerHandle,
} from '../lib/marker-elements';

interface JourneyMapProps {
  status: LiveStatus;
  route: RouteData | null;
  className?: string;
  /** Renders the tighter card; tap Expand for fullscreen. */
  compact?: boolean;
}

type LngLat = [number, number];

const CARTO_DARK =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const CARTO_LIGHT =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

const FALLBACK_CENTER: LngLat = [77.2199, 28.6423];

function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function maptilerKey(): string | null {
  const stored =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('maptiler_key')
      : null;
  const key = stored || process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!key || key === 'YOUR_MAPTILER_KEY_HERE') return null;
  return key;
}

/**
 * Returns rich vector map styles for real Indian cartography:
 * Streets-v2 (Google/Uber style roads & cities), Satellite Hybrid, Topo, or Dark.
 */
function styleUrl(mode: MapStyleMode): string {
  const key = maptilerKey();
  if (key) {
    switch (mode) {
      case 'satellite':
        return `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`;
      case 'topo':
        return `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${key}`;
      case 'dark':
        return `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${key}`;
      case 'streets':
      default:
        return `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`;
    }
  }
  // Fallbacks if key is not configured
  return mode === 'dark' ? CARTO_DARK : CARTO_LIGHT;
}

const CARTO_RASTER_DARK =
  'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
const CARTO_RASTER_LIGHT =
  'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
const OSM_RASTER = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const INLINE_CARTO = '__inline-carto__';
const INLINE_OSM = '__inline-osm__';

function fallbackStyle(
  mode: MapStyleMode,
  tiles: string,
  attribution: string
): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: [tiles],
        tileSize: 256,
        attribution,
      },
    },
    layers: [
      {
        id: 'basemap-background',
        type: 'background',
        paint: {
          'background-color': mode === 'dark' ? '#0b1220' : '#e7ecf1',
        },
      },
      { id: 'basemap', type: 'raster', source: 'basemap' },
    ],
  };
}

// Vibrant high-contrast route colors (matching the live train map aesthetic)
const TRACK_DONE = '#ea580c'; // Neon Brand Orange
const TRACK_PENDING = '#06b6d4'; // Bright Cyan / Electric Blue

export function JourneyMap({
  status,
  route,
  className,
  compact = false,
}: JourneyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trainMarkerRef = useRef<maplibregl.Marker | null>(null);
  const trainHandleRef = useRef<TrainMarkerHandle | null>(null);
  const trainHeadingRef = useRef<number | null>(null);
  const stationMarkersRef = useRef<
    { marker: maplibregl.Marker; handle: StationMarkerHandle; code: string }[]
  >([]);
  const appliedStyleRef = useRef<string | null>(null);

  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);

  const [webglSupported] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    return hasWebGL();
  });
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [styleEpoch, setStyleEpoch] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [follow, setFollow] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>(() =>
    resolvedTheme === 'light' ? 'streets' : 'dark'
  );
  const userPickedStyle = useRef(false);

  const progress = Math.min(100, Math.max(0, status.progress || 0));
  const lng = status.currentLocation?.lng ?? FALLBACK_CENTER[0];
  const lat = status.currentLocation?.lat ?? FALLBACK_CENTER[1];

  const center = useMemo<LngLat>(() => [lng, lat], [lng, lat]);
  const initialCenterRef = useRef<LngLat>(center);
  const initialStyleRef = useRef<MapStyleMode>(mapStyleMode);
  const styleModeRef = useRef<MapStyleMode>(mapStyleMode);

  const [animatedCenter, setAnimatedCenter] = useState<LngLat>(center);
  const [trainHeading, setTrainHeading] = useState(0);
  const animatedCenterRef = useRef<LngLat>(center);
  const animFrameRef = useRef<number | null>(null);
  const cameraTickRef = useRef(0);

  const coordinates = useMemo<LngLat[]>(() => {
    const raw = route?.polyline?.geometry?.coordinates;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((c): c is number[] => Array.isArray(c) && c.length >= 2)
      .map((c) => [c[0], c[1]] as LngLat);
  }, [route]);

  const routeLine = useMemo<GeoJSON.Feature<GeoJSON.LineString> | null>(() => {
    if (coordinates.length < 2) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates },
    };
  }, [coordinates]);

  const routeLengthKm = useMemo(
    () => (routeLine ? length(routeLine, { units: 'kilometers' }) : 0),
    [routeLine]
  );

  const bounds = useMemo(() => {
    if (coordinates.length < 2) return null;
    const lngs = coordinates.map((c) => c[0]);
    const lats = coordinates.map((c) => c[1]);
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ] as [LngLat, LngLat];
  }, [coordinates]);

  const { zoomIn, zoomOut, flyToTrain } = useMapCamera({
    map,
    ready: Boolean(map),
    center: animatedCenter,
    heading: trainHeading,
    follow,
    is3D,
    bounds,
    fitKey: `${status.trainNumber}:${coordinates.length}`,
  });

  // Next station details for HUD
  const nextStop = status.stationStatuses?.find(
    (entry) => entry.station.code === status.nextStation?.code
  );
  const distanceToNext =
    nextStop && nextStop.distanceFromSource > status.distanceCovered
      ? Math.round((nextStop.distanceFromSource - status.distanceCovered) * 10) /
        10
      : status.distanceRemaining;

  // Origin station calculation
  const originStation =
    status.stationStatuses?.[0]?.station ?? status.previousStation ?? status.currentStation;

  // ---------------------------------------------------------------- init
  useEffect(() => {
    const container = containerRef.current;
    if (!container || webglSupported === false) return;

    const initialUrl = styleUrl(initialStyleRef.current);
    appliedStyleRef.current = initialUrl;

    const instance = new maplibregl.Map({
      container,
      style: initialUrl,
      center: initialCenterRef.current,
      zoom: 6.0,
      pitch: 0,
      bearing: 0,
      maxZoom: 19,
      attributionControl: false,
      dragRotate: true,
      pitchWithRotate: true,
    });

    instance.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    let ready = false;
    const markReady = () => {
      if (ready) return;
      ready = true;
      setMap(instance);
      window.setTimeout(() => {
        try {
          instance.resize();
        } catch {
          /* container unmounted */
        }
      }, 240);
    };

    instance.on('load', markReady);

    const releaseFollow = () => setFollow(false);
    instance.on('dragstart', releaseFollow);

    instance.on('error', (event) => {
      const message = event?.error?.message ?? '';
      const isTileError = (event as { tile?: unknown }).tile !== undefined;
      const lower = message.toLowerCase();
      const isStyleError =
        message.includes('403') ||
        message.includes('404') ||
        message.includes('Failed to fetch') ||
        lower.includes('style') ||
        lower.includes('sprite') ||
        lower.includes('glyph');

      const current = appliedStyleRef.current;
      const onRaster = current === INLINE_CARTO || current === INLINE_OSM;

      if (isTileError && !onRaster) return;
      if (!isTileError && !isStyleError) return;
      if (current === INLINE_OSM) return;

      const mode = styleModeRef.current;
      let nextKey: string;
      let next: maplibregl.StyleSpecification | string;

      if (current === INLINE_CARTO) {
        nextKey = INLINE_OSM;
        next = fallbackStyle(mode, OSM_RASTER, '© OpenStreetMap contributors');
      } else if (current === CARTO_DARK || current === CARTO_LIGHT) {
        nextKey = INLINE_CARTO;
        next = fallbackStyle(
          mode,
          mode === 'dark' ? CARTO_RASTER_DARK : CARTO_RASTER_LIGHT,
          '© OpenStreetMap contributors © CARTO'
        );
      } else {
        const fallback = mode === 'dark' ? CARTO_DARK : CARTO_LIGHT;
        if (current === fallback) return;
        nextKey = fallback;
        next = fallback;
      }

      appliedStyleRef.current = nextKey;
      try {
        instance.setStyle(next);
        instance.once('styledata', () =>
          setStyleEpoch((epoch) => epoch + 1)
        );
      } catch {
        /* ignore */
      }
    });

    const safety = window.setTimeout(markReady, 2500);

    return () => {
      window.clearTimeout(safety);
      instance.off('dragstart', releaseFollow);
      trainMarkerRef.current?.remove();
      trainMarkerRef.current = null;
      trainHandleRef.current = null;
      stationMarkersRef.current.forEach((s) => s.marker.remove());
      stationMarkersRef.current = [];
      setMap(null);
      instance.remove();
    };
  }, [webglSupported]);

  // -------------------------------------------------------------- theme
  useEffect(() => {
    if (userPickedStyle.current) return;
    setMapStyleMode(resolvedTheme === 'light' ? 'streets' : 'dark');
  }, [resolvedTheme]);

  useEffect(() => {
    styleModeRef.current = mapStyleMode;
    if (!map) return;
    const url = styleUrl(mapStyleMode);
    if (appliedStyleRef.current === url) return;

    appliedStyleRef.current = url;
    map.setStyle(url);
    map.once('styledata', () => setStyleEpoch((epoch) => epoch + 1));
  }, [map, mapStyleMode]);

  // ------------------------------------------------------- route geometry
  useEffect(() => {
    if (!map || coordinates.length < 2) return;

    // ---- Add OpenRailwayMap overlay (rail network lines across India) ----
    try {
      if (!map.getSource('openrailwaymap')) {
        map.addSource('openrailwaymap', {
          type: 'raster',
          tiles: [
            'https://a.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
            'https://b.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
            'https://c.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenRailwayMap contributors',
        });
        map.addLayer({
          id: 'openrailwaymap',
          type: 'raster',
          source: 'openrailwaymap',
          paint: { 'raster-opacity': mapStyleMode === 'dark' ? 0.68 : 0.45 },
          minzoom: 2,
          maxzoom: 19,
        });
      }
    } catch {
      /* overlay failed — continue without it */
    }

    const splitIndex = Math.max(
      1,
      Math.floor((progress / 100) * (coordinates.length - 1))
    );
    const done = coordinates.slice(0, splitIndex + 1);
    const pending = coordinates.slice(splitIndex);

    const feature = (
      coords: LngLat[]
    ): GeoJSON.Feature<GeoJSON.LineString> => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    });

    const upsert = (
      id: string,
      coords: LngLat[],
      paint: maplibregl.LineLayerSpecification['paint']
    ) => {
      const existing = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
      if (existing) {
        existing.setData(feature(coords));
        return;
      }
      map.addSource(id, { type: 'geojson', data: feature(coords) });
      map.addLayer({
        id,
        type: 'line',
        source: id,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint,
      });
    };

    try {
      // 1. Neon glowing under-layer for completed journey
      upsert('track-glow', done, {
        'line-color': TRACK_DONE,
        'line-width': 16,
        'line-opacity': 0.4,
        'line-blur': 6,
      });
      // 2. High-contrast electric cyan dashed line for remaining route
      upsert('track-pending', pending.length >= 2 ? pending : done.slice(-2), {
        'line-color': TRACK_PENDING,
        'line-width': 4,
        'line-dasharray': [3, 3],
        'line-opacity': 0.85,
      });
      // 3. Crisp solid track for completed route
      upsert('track-done', done, {
        'line-color': TRACK_DONE,
        'line-width': 5.5,
      });
      // 4. White railway ties for realistic track rendering
      upsert('track-ties', done, {
        'line-color': '#ffffff',
        'line-width': 1.8,
        'line-dasharray': [1.5, 3],
        'line-opacity': 0.9,
      });
    } catch {
      /* style swapped mid-update; the next epoch re-adds everything */
    }
  }, [map, coordinates, progress, styleEpoch, mapStyleMode]);

  // ------------------------------------------------------ station markers
  useEffect(() => {
    if (!map) return;
    const stations = route?.stations ?? [];

    stationMarkersRef.current.forEach((s) => s.marker.remove());
    stationMarkersRef.current = [];

    if (stations.length === 0) return;

    const scheduleByCode = new Map(
      status.stationStatuses.map((s) => [s.station.code, s])
    );

    stations.forEach((entry) => {
      const handle = createStationMarker(
        entry.station.code,
        entry.station.name,
        entry.positionOnLine * 100 <= progress
      );

      const schedule = scheduleByCode.get(entry.station.code);
      const popup = new maplibregl.Popup({
        offset: 16,
        closeButton: true,
        maxWidth: '260px',
      }).setHTML(
        stationPopupHTML({
          code: entry.station.code,
          name: entry.station.name,
          distanceFromSource: entry.distanceFromSource,
          scheduledArrival: schedule?.scheduledArrival,
          scheduledDeparture: schedule?.scheduledDeparture,
          platform: schedule?.platform,
          delay: schedule?.delay,
        })
      );

      const marker = new maplibregl.Marker({ element: handle.element })
        .setLngLat([entry.station.lng, entry.station.lat])
        .setPopup(popup)
        .addTo(map);

      stationMarkersRef.current.push({
        marker,
        handle,
        code: entry.station.code,
      });
    });
  }, [map, route, progress, status.stationStatuses]);

  // Repaint visited state in place on every poll.
  useEffect(() => {
    const stations = route?.stations ?? [];
    if (stations.length === 0) return;

    const currentCode = status.currentStation?.code;
    stationMarkersRef.current.forEach((entry, index) => {
      const position = (stations[index]?.positionOnLine ?? 0) * 100;
      entry.handle.setVisited(position <= progress);
      entry.handle.setCurrent(entry.code === currentCode);
    });
  }, [route, progress, status.currentStation?.code]);

  // -------------------------------------------------------- Directional Arrow Train Marker
  // The vehicle smoothly glides along the rail polyline with dynamic tangent bearing
  // calculation and smooth 60fps interpolation.
  useEffect(() => {
    if (!map) return;

    if (!trainMarkerRef.current) {
      const handle = createTrainMarker();
      trainHandleRef.current = handle;
      trainMarkerRef.current = new maplibregl.Marker({
        element: handle.element,
      })
        .setLngLat(animatedCenterRef.current)
        .addTo(map);
    }

    const targetDistance = Math.min(
      routeLengthKm,
      Math.max(0, (progress / 100) * routeLengthKm)
    );

    const target: LngLat = (() => {
      if (!routeLine || routeLengthKm <= 0) return center;
      const point = along(routeLine, targetDistance);
      return [point.geometry.coordinates[0], point.geometry.coordinates[1]];
    })();

    // Compute tangent bearing of the track ahead
    let computedHeading = 0;
    if (routeLine && routeLengthKm > 0) {
      const lookAheadDist = Math.min(routeLengthKm, targetDistance + 0.15);
      const currentPoint = along(routeLine, targetDistance);
      const aheadPoint = along(routeLine, lookAheadDist);
      computedHeading = bearing(
        [currentPoint.geometry.coordinates[0], currentPoint.geometry.coordinates[1]],
        [aheadPoint.geometry.coordinates[0], aheadPoint.geometry.coordinates[1]]
      );
    }

    const start = animatedCenterRef.current;
    const distance = Math.hypot(target[0] - start[0], target[1] - start[1]);
    const duration =
      distance < 1e-7 ? 0 : Math.min(2800, Math.max(800, distance * 160000));
    const heading =
      distance < 1e-7
        ? (trainHeadingRef.current ?? computedHeading)
        : computedHeading;

    const applyPosition = (position: LngLat, degrees: number) => {
      trainMarkerRef.current?.setLngLat(position);
      trainHandleRef.current?.setHeading(degrees);
      trainHeadingRef.current = degrees;
      animatedCenterRef.current = position;

      const now = performance.now();
      if (now - cameraTickRef.current > 100) {
        cameraTickRef.current = now;
        setAnimatedCenter(position);
        setTrainHeading(degrees);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (duration === 0) {
      applyPosition(target, heading);
      trainHandleRef.current?.setMoving(false);
      return;
    }

    const startedAt = performance.now();
    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    trainHandleRef.current?.setMoving(true);

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = easeInOut(t);
      const position: LngLat = [
        start[0] + (target[0] - start[0]) * eased,
        start[1] + (target[1] - start[1]) * eased,
      ];
      applyPosition(position, heading);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        trainHandleRef.current?.setMoving(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      trainHandleRef.current?.setMoving(false);
    };
  }, [map, routeLine, routeLengthKm, progress, center]);

  // ---------------------------------------------------------- fullscreen
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      window.setTimeout(() => map?.resize(), 260);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [map]);

  const toggleFullscreen = useCallback(() => {
    const element = containerRef.current?.parentElement;
    if (!element) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void element.requestFullscreen().catch(() => {});
  }, []);

  const cycleMapStyle = useCallback(() => {
    userPickedStyle.current = true;
    const styles: MapStyleMode[] = ['streets', 'satellite', 'topo', 'dark'];
    setMapStyleMode((current) => {
      const idx = styles.indexOf(current);
      return styles[(idx + 1) % styles.length];
    });
  }, []);

  const toggle3D = useCallback(() => {
    setIs3D((prev) => !prev);
  }, []);

  const handleLocate = useCallback(() => {
    setFollow(true);
    flyToTrain();
  }, [flyToTrain]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden rounded-[26px] border border-border bg-surface-sunken shadow-2xl',
        className
      )}
    >
      <div
        ref={containerRef}
        className={cn(
          'relative w-full transition-[height] duration-300',
          isFullscreen
            ? 'h-screen supports-[height:100dvh]:h-[100dvh]'
            : compact
              ? 'h-[320px] min-h-[260px] sm:h-[360px] lg:h-[400px]'
              : 'h-[360px] min-h-[300px] sm:h-[420px] lg:h-[460px]'
        )}
      />

      {/* ================= HUD OVERLAY (TOP-LEFT) ================= */}
      <div
        className={cn(
          'pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-2 max-w-[calc(100%-80px)] sm:left-4 sm:top-4',
          isFullscreen && 'pl-safe pt-safe'
        )}
      >
        {/* Status + Train Name Pill */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="inline-flex items-center flex-wrap gap-2 rounded-2xl border border-white/20 dark:border-white/15 bg-background/80 dark:bg-black/65 px-3.5 py-2 text-xs font-semibold text-text-primary dark:text-white backdrop-blur-xl shadow-xl"
        >
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-accent">
            <Radio className="h-3 w-3 text-accent animate-pulse" />
            <span>Live GPS</span>
          </div>

          <span className="text-text-muted/50 dark:text-white/30">·</span>

          <span className="font-mono font-extrabold text-accent">
            #{status.trainNumber}
          </span>

          <span className="font-bold truncate max-w-[160px] sm:max-w-[240px]">
            {status.trainName}
          </span>

          <span className="hidden sm:inline-flex text-text-muted text-[11px] font-normal">
            ({originStation.code} → {status.lastStation?.code})
          </span>
        </motion.div>

        {/* Live Telemetry Pill */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="inline-flex items-center flex-wrap gap-2.5 rounded-full border border-white/20 dark:border-white/15 bg-background/80 dark:bg-black/65 px-3.5 py-1.5 text-xs font-semibold text-text-primary dark:text-white backdrop-blur-xl shadow-lg"
        >
          <div className="flex items-center gap-1 text-accent font-bold">
            <Gauge className="h-3.5 w-3.5" />
            <span className="tabular">{Math.round(status.speed)} km/h</span>
          </div>

          <span className="text-text-muted/50 dark:text-white/30">·</span>

          <div
            className={cn(
              'flex items-center gap-1 font-bold text-[11px]',
              getDelayColor(status.delay)
            )}
          >
            <Clock className="h-3 w-3" />
            <span>{formatDelay(status.delay)}</span>
          </div>

          <span className="text-text-muted/50 dark:text-white/30">·</span>

          <span className="tabular text-text-secondary dark:text-white/80 text-[11px]">
            {Math.round(progress)}% covered
          </span>
        </motion.div>
      </div>

      {/* ================= NEXT STOP HUD PILL (BOTTOM-LEFT) ================= */}
      {status.nextStation && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="pointer-events-none absolute bottom-10 left-4 z-10 hidden sm:inline-flex items-center gap-2 rounded-2xl border border-white/20 dark:border-white/15 bg-background/80 dark:bg-black/65 px-4 py-2 text-xs font-semibold text-text-primary dark:text-white backdrop-blur-xl shadow-xl max-w-md"
        >
          <Navigation className="h-3.5 w-3.5 text-accent shrink-0" />
          <div className="truncate">
            <span className="text-text-muted dark:text-white/60 font-normal">Next: </span>
            <span className="font-bold text-text-primary dark:text-white">
              {status.nextStation.name}
            </span>
            <span className="font-mono text-[11px] text-accent ml-1.5">
              ({status.nextStation.code})
            </span>
            <span className="text-text-muted/50 dark:text-white/30 mx-1.5">·</span>
            <span className="text-text-secondary dark:text-white/80">
              {formatDistance(distanceToNext)}
            </span>
            {status.nextStationEta && (
              <>
                <span className="text-text-muted/50 dark:text-white/30 mx-1.5">·</span>
                <span className="text-text-muted dark:text-white/70">
                  ETA {formatTime(status.nextStationEta.split('T')[1]?.slice(0, 5) || '')}
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Floating Camera & Style Controls */}
      <FloatingControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onLocate={handleLocate}
        onToggleStyle={cycleMapStyle}
        onToggleFollow={() => setFollow((value) => !value)}
        onToggle3D={toggle3D}
        onToggleFullscreen={toggleFullscreen}
        follow={follow}
        is3D={is3D}
        mapStyleMode={mapStyleMode}
        fullscreen={isFullscreen}
        compact={compact && !isFullscreen}
      />

      {/* Expand pill for compact mode */}
      {compact && (
        <Button
          variant="ghost"
          size="md"
          type="button"
          onClick={toggleFullscreen}
          className="absolute bottom-10 left-4 sm:hidden z-10 rounded-full border border-white/20 dark:border-white/15 bg-background/80 dark:bg-black/65 text-text-primary dark:text-white backdrop-blur-xl shadow-xl hover:scale-105 hover:bg-background/80 dark:hover:bg-black/65"
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
          <span>{isFullscreen ? 'Exit fullscreen' : 'Expand map'}</span>
        </Button>
      )}

      {/* WebGL unsupported fallback */}
      {webglSupported === false && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-surface-sunken px-6">
          <div className="text-center max-w-sm">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface text-text-muted">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-text-primary">
              Live map unavailable
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              Your device or browser doesn&apos;t support the WebGL graphics
              required to render the map. Live tracking data and journey
              analytics below still work.
            </p>
          </div>
        </div>
      )}

      {/* Loading veil */}
      {webglSupported !== false && !map && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-surface-sunken">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-sm font-semibold text-text-secondary">
              Rendering live navigation map…
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
