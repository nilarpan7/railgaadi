'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Compass, Waves, Mountain, Landmark, Sparkles, Navigation } from 'lucide-react';
import { getNearbyPlaces } from '@/services/api';
import { CACHE, REFRESH } from '@/lib/constants';
import { getPOIEmoji, cn } from '@/lib/utils';
import type { LiveStatus } from '@/types/train';
import type { POICategory, NearbyPlace } from '@/types/nearby';
import { SpotlightCard, Button } from '@/components/ui';
import { SPRING } from '@/lib/motion';

interface NearbySectionProps {
  status: LiveStatus;
}

const CATEGORIES: { label: string; cat: POICategory | 'all'; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'All Places', cat: 'all', icon: Compass },
  { label: 'Rivers', cat: 'river', icon: Waves },
  { label: 'Mountains', cat: 'mountain', icon: Mountain },
  { label: 'Bridges', cat: 'bridge', icon: Navigation },
  { label: 'Tunnels', cat: 'tunnel', icon: Navigation },
  { label: 'Attractions', cat: 'tourist', icon: Landmark },
];

export function NearbySection({ status }: NearbySectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<POICategory | 'all'>('all');

  const latRounded = Number(status.currentLocation.lat.toFixed(2));
  const lngRounded = Number(status.currentLocation.lng.toFixed(2));

  const { data: places, isLoading } = useQuery<NearbyPlace[]>({
    queryKey: ['nearby', latRounded, lngRounded],
    queryFn: async () => {
      const response = await getNearbyPlaces(latRounded, lngRounded, 8000);
      return response || [];
    },
    staleTime: CACHE.NEARBY,
  });

  const filteredPlaces = (places || []).filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  return (
    <div className="card-premium rounded-3xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="font-display text-sm font-bold text-text-primary">
            Smart Travel Companion — Nearby Landmarks
          </h3>
        </div>
        <p className="text-xs font-semibold text-text-muted">
          Showing features within 8 km of train
        </p>
      </div>

      {/* Category Tabs */}
      <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const isSelected = selectedCategory === c.cat;
          return (
            <Button
              key={c.cat}
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setSelectedCategory(c.cat)}
              aria-pressed={isSelected}
              aria-label={`Show ${c.label.toLowerCase()} nearby places`}
              className={cn(
                'relative shrink-0 rounded-full px-4 text-xs font-bold whitespace-nowrap',
                isSelected
                  ? 'text-white hover:text-white'
                  : 'border border-border bg-surface text-text-secondary hover:border-accent/30 hover:text-text-primary'
              )}
            >
              {isSelected && (
                <motion.span
                  layoutId="nearbyCatPill"
                  transition={SPRING.soft}
                  className="accent-gradient absolute inset-0 rounded-full shadow-[0_4px_14px_var(--accent-glow)]"
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </span>
            </Button>
          );
        })}
      </div>

      {/* POI Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : filteredPlaces.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-border bg-surface-alt/40 text-center">
          <p className="text-xs font-semibold text-text-muted">
            No landmarks found in this category near the train&apos;s current position.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPlaces.slice(0, 6).map((place, i) => (
            <motion.div
              key={place.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <SpotlightCard className="h-full p-4 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-surface-alt border border-border flex items-center justify-center text-xl shrink-0 shadow-xs">
                  {getPOIEmoji(place.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-text-primary truncate">
                      {place.name}
                    </h4>
                    <span className="text-[10px] font-bold text-accent bg-accent-light px-2 py-0.5 rounded-full border border-accent/20 shrink-0">
                      {place.distance} km
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-1 capitalize font-medium">
                    {place.description || `${place.category} along route`}
                  </p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
