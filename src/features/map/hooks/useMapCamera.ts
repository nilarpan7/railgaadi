'use client';

import { useCallback, useEffect, useRef } from 'react';
import type * as maplibregl from 'maplibre-gl';

type LngLat = [number, number];
type Bounds = [LngLat, LngLat];

interface UseMapCameraOptions {
  map: maplibregl.Map | null;
  /** Only true once the style has loaded. */
  ready: boolean;
  /** Live position of the train. */
  center: LngLat | null;
  /** Heading (degrees from north) the train is currently travelling. */
  heading?: number | null;
  /** Keep the train in view as it moves. */
  follow: boolean;
  /** Whether 3D Navigation Mode (pitched + rotated) or 2D Flat Mode is active. */
  is3D?: boolean;
  /** Whole-route bounds, fitted once per `fitKey`. */
  bounds?: Bounds | null;
  /** Change this (e.g. to the train number) to re-fit the route. */
  fitKey?: string | null;
}

/** Uber/Rapido-grade 3D Navigation Follow tilt */
const NAV_PITCH_3D = 52;

/**
 * Controls camera movement with 3D Navigation follow (Uber/Rapido style)
 * or 2D overview perspective.
 */
export function useMapCamera({
  map,
  ready,
  center,
  heading = null,
  follow,
  is3D = true,
  bounds = null,
  fitKey = null,
}: UseMapCameraOptions) {
  const fittedKeyRef = useRef<string | null>(null);
  const justFittedRef = useRef(false);

  // 1. Frame the full route — once per journey, not on every poll.
  useEffect(() => {
    if (!map || !ready || !bounds) return;
    if (fitKey !== null && fittedKeyRef.current === fitKey) return;

    fittedKeyRef.current = fitKey;
    justFittedRef.current = true;

    try {
      map.fitBounds(bounds, { padding: 64, duration: 1400, maxZoom: 10.5 });
    } catch {
      /* bounds can be degenerate on partial data */
    }
  }, [map, ready, bounds, fitKey]);

  // 2. Follow the train — pitched and aligned with heading in 3D, or flat in 2D
  useEffect(() => {
    if (!map || !ready) return;

    if (!is3D && map.getPitch() !== 0) {
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 800,
      });
    }

    if (!follow || !center) return;

    // Don't yank the camera away from the fit-bounds animation we just started.
    if (justFittedRef.current) {
      justFittedRef.current = false;
      return;
    }

    try {
      map.easeTo({
        center,
        zoom: Math.max(map.getZoom(), is3D ? 10.5 : 8.5),
        pitch: is3D ? NAV_PITCH_3D : 0,
        bearing: is3D && heading != null ? heading : 0,
        duration: 1100,
        essential: true,
      });
    } catch {
      /* map torn down mid-animation */
    }
  }, [map, ready, follow, center, heading, is3D]);

  const zoomIn = useCallback(() => map?.zoomIn({ duration: 280 }), [map]);
  const zoomOut = useCallback(() => map?.zoomOut({ duration: 280 }), [map]);

  const flyToTrain = useCallback(() => {
    if (!map || !center) return;
    map.flyTo({
      center,
      zoom: is3D ? 11.2 : 9.6,
      pitch: is3D ? NAV_PITCH_3D : 0,
      bearing: is3D && heading != null ? heading : 0,
      duration: 1300,
      essential: true,
    });
  }, [map, center, heading, is3D]);

  /** Lets the caller re-frame the route on demand. */
  const resetFit = useCallback(() => {
    fittedKeyRef.current = null;
  }, []);

  return { zoomIn, zoomOut, flyToTrain, resetFit };
}
