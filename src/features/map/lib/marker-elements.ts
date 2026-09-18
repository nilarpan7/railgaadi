/**
 * DOM factories for MapLibre markers.
 *
 * MapLibre wants real elements, not React trees, so these build them once and
 * hand back small imperative handles. All colour/animation comes from tokens
 * and classes in `globals.css` so the markers follow the active theme.
 */

/**
 * Directional Arrow Glyph (High-contrast stealth chevron/arrow style)
 * Default pointing North (0deg) for direct bearing rotation mapping.
 */
const DIRECTIONAL_ARROW_GLYPH = `
<svg viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-8 h-9 drop-shadow-[0_4px_12px_rgba(234,88,12,0.6)]">
  <defs>
    <linearGradient id="arrowGrad" x1="20" y1="2" x2="20" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="45%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="coreOrangeGrad" x1="20" y1="6" x2="20" y2="38" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fed7aa" />
      <stop offset="30%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
    <filter id="arrowGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Outer Shadow Accent -->
  <path d="M20 3 L36 37 L20 29 L4 37 Z" 
        fill="#0f172a" 
        opacity="0.8" 
        transform="translate(0, 2)" />

  <!-- Main Directional Chevron Body -->
  <path d="M20 2 L36 36 L20 28 L4 36 Z" 
        fill="url(#coreOrangeGrad)" 
        stroke="#ffffff" 
        stroke-width="2" 
        stroke-linejoin="round" 
        stroke-linecap="round" />

  <!-- Inner High-Tech Jet Core -->
  <path d="M20 8 L30 32 L20 26 L10 32 Z" 
        fill="#ffffff" 
        opacity="0.9" />

  <path d="M20 11 L27 29 L20 25 L13 29 Z" 
        fill="#ea580c" />

  <!-- Forward Navigation Light Beam (Beacon Dot) -->
  <circle cx="20" cy="5" r="2.2" fill="#ffffff" filter="url(#arrowGlow)" />
</svg>`;

export interface TrainMarkerHandle {
  element: HTMLDivElement;
  /** Rotates the engine icon toward the direction of travel. */
  setHeading: (degrees: number) => void;
  /** Toggles the "in motion" pulse so the train reads as moving. */
  setMoving: (moving: boolean) => void;
}

export function createTrainMarker(): TrainMarkerHandle {
  const element = document.createElement('div');
  element.className = 'train-marker';
  element.setAttribute('aria-hidden', 'true');

  // Concentric Radar Waves
  const radar1 = document.createElement('div');
  radar1.className = 'train-marker__radar';

  const radar2 = document.createElement('div');
  radar2.className = 'train-marker__radar train-marker__radar--2';

  // Rotatable Arrow Container
  const icon = document.createElement('div');
  icon.className = 'train-marker__icon';

  // Forward Headlight Glow Beam
  const headlight = document.createElement('div');
  headlight.className = 'train-headlight-beam';

  // Arrow SVG
  const svgWrapper = document.createElement('div');
  svgWrapper.className = 'train-arrow-wrapper transition-transform duration-100 ease-out';
  svgWrapper.innerHTML = DIRECTIONAL_ARROW_GLYPH;

  // Slipstream trail
  const trail = document.createElement('div');
  trail.className = 'train-marker__trail';

  icon.appendChild(headlight);
  icon.appendChild(svgWrapper);
  icon.appendChild(trail);

  element.appendChild(radar1);
  element.appendChild(radar2);
  element.appendChild(icon);

  return {
    element,
    setHeading: (degrees: number) => {
      icon.style.transform = `rotate(${degrees}deg)`;
    },
    setMoving: (moving: boolean) => {
      element.classList.toggle('train-marker--moving', moving);
    },
  };
}

export interface StationMarkerHandle {
  element: HTMLDivElement;
  setVisited: (visited: boolean) => void;
  setCurrent: (current: boolean) => void;
}

export function createStationMarker(
  code: string,
  name: string,
  visited: boolean
): StationMarkerHandle {
  const element = document.createElement('div');
  element.className = 'flex flex-col items-center';
  element.title = `${name} (${code})`;

  const dot = document.createElement('span');
  dot.style.cssText = [
    'width:11px',
    'height:11px',
    'border-radius:9999px',
    'border:2px solid var(--background)',
    'transition:background-color 320ms ease, box-shadow 320ms ease, transform 320ms ease',
  ].join(';');

  const label = document.createElement('span');
  label.className = 'station-marker-label';
  label.textContent = code;
  label.style.cssText = [
    'margin-top:3px',
    'padding:1px 5px',
    'border-radius:5px',
    'background:color-mix(in srgb, var(--background) 82%, transparent)',
    'border:1px solid var(--border)',
    'white-space:nowrap',
    'transition:color 320ms ease',
  ].join(';');

  element.append(dot, label);

  const paint = (isVisited: boolean, isCurrent: boolean) => {
    const color = isVisited ? 'var(--accent)' : 'var(--accent-teal)';
    dot.style.background = color;
    dot.style.boxShadow = `0 0 8px ${
      isVisited ? 'var(--accent-glow, rgba(234,88,12,0.7))' : 'rgba(45,212,191,0.55)'
    }`;
    dot.style.transform = isCurrent ? 'scale(1.45)' : 'scale(1)';
    label.style.color = isVisited ? 'var(--accent)' : 'var(--text-secondary)';
  };

  let visitedState = visited;
  let currentState = false;
  paint(visitedState, currentState);

  return {
    element,
    setVisited: (next: boolean) => {
      if (next === visitedState) return;
      visitedState = next;
      paint(visitedState, currentState);
    },
    setCurrent: (next: boolean) => {
      if (next === currentState) return;
      currentState = next;
      paint(visitedState, currentState);
    },
  };
}

/** Popup markup for a station click. Kept as a string — MapLibre sets innerHTML. */
export function stationPopupHTML(input: {
  code: string;
  name: string;
  distanceFromSource?: number;
  scheduledArrival?: string | null;
  scheduledDeparture?: string | null;
  platform?: number | null;
  delay?: number | null;
}): string {
  const rows: string[] = [];

  if (typeof input.distanceFromSource === 'number') {
    rows.push(
      row('Distance', `${Math.round(input.distanceFromSource)} km from source`)
    );
  }
  if (input.scheduledArrival) rows.push(row('Arrives', input.scheduledArrival));
  if (input.scheduledDeparture)
    rows.push(row('Departs', input.scheduledDeparture));
  if (input.platform) rows.push(row('Platform', `PF ${input.platform}`));
  if (typeof input.delay === 'number' && input.delay > 0) {
    rows.push(row('Delay', `${input.delay} min late`));
  }

  return `
    <div style="min-width:190px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-family:var(--font-mono),monospace;font-size:10px;font-weight:800;
                     letter-spacing:0.04em;color:var(--accent);background:var(--accent-light);
                     padding:2px 6px;border-radius:6px">${escapeHTML(input.code)}</span>
      </div>
      <div style="font-size:13px;font-weight:700;line-height:1.25;margin-bottom:8px">
        ${escapeHTML(input.name)}
      </div>
      <div style="display:grid;gap:3px">${rows.join('')}</div>
    </div>`;
}

function row(label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px">
    <span style="color:var(--text-muted)">${escapeHTML(label)}</span>
    <span style="font-weight:600">${escapeHTML(value)}</span>
  </div>`;
}

function escapeHTML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
