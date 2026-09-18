'use client';

import { motion } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Locate,
  Layers,
  Navigation,
  Compass,
  Maximize2,
  Minimize2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/motion';
import { Button } from '@/components/ui';

export type MapStyleMode = 'streets' | 'satellite' | 'topo' | 'dark';

interface FloatingControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onToggleStyle: () => void;
  onToggleFollow: () => void;
  onToggle3D?: () => void;
  onToggleFullscreen: () => void;
  follow: boolean;
  is3D?: boolean;
  mapStyleMode?: MapStyleMode;
  fullscreen: boolean;
  className?: string;
  compact?: boolean;
}

interface ControlSpec {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: string;
}

export function FloatingControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  onToggleStyle,
  onToggleFollow,
  onToggle3D,
  onToggleFullscreen,
  follow,
  is3D = true,
  mapStyleMode = 'streets',
  fullscreen,
  className,
  compact = false,
}: FloatingControlsProps) {
  const styleLabels: Record<MapStyleMode, string> = {
    streets: 'Streets 🗺️',
    satellite: 'Satellite 🛰️',
    topo: 'Topo 🏔️',
    dark: 'Dark 🌙',
  };

  const controls: ControlSpec[] = [
    { icon: ZoomIn, label: 'Zoom in', onClick: onZoomIn },
    { icon: ZoomOut, label: 'Zoom out', onClick: onZoomOut },
    { icon: Locate, label: 'Center on train', onClick: onLocate },
    ...(onToggle3D
      ? [
          {
            icon: Compass,
            label: is3D ? 'Switch to 2D Overview' : 'Switch to 3D Navigation',
            onClick: onToggle3D,
            active: is3D,
            badge: is3D ? '3D' : '2D',
          },
        ]
      : []),
    {
      icon: Layers,
      label: `Map Style: ${styleLabels[mapStyleMode]}`,
      onClick: onToggleStyle,
    },
    ...(compact
      ? []
      : ([
          {
            icon: Navigation,
            label: follow ? 'Stop following train' : 'Follow train',
            onClick: onToggleFollow,
            active: follow,
          },
        ] as ControlSpec[])),
    {
      icon: fullscreen ? Minimize2 : Maximize2,
      label: fullscreen ? 'Exit fullscreen' : 'Fullscreen',
      onClick: onToggleFullscreen,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35, ...SPRING.soft }}
      className={cn(
        'absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-black/55 p-1.5 backdrop-blur-xl shadow-2xl',
        className
      )}
    >
      {controls.map((control) => {
        const Icon = control.icon;
        return (
          <Button
            key={control.label}
            variant="ghost"
            size="icon"
            type="button"
            onClick={control.onClick}
            className={cn(
              'relative rounded-xl border',
              control.active
                ? 'border-accent/60 bg-accent/25 text-accent hover:bg-accent/25 hover:text-accent'
                : 'border-white/10 text-white/80 hover:border-accent/40 hover:bg-white/10 hover:text-white'
            )}
            aria-label={control.label}
            aria-pressed={control.active}
            title={control.label}
          >
            <Icon className="h-[15px] w-[15px]" strokeWidth={2.2} />
            {control.badge && (
              <span className="absolute -bottom-1 -right-1 rounded-sm bg-accent px-1 text-[8px] font-black text-white leading-tight">
                {control.badge}
              </span>
            )}
          </Button>
        );
      })}
    </motion.div>
  );
}
