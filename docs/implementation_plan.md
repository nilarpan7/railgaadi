# RailGaadi — Complete Implementation Plan (MVP v1.0)

A premium real-time train journey visualization platform with a **Parley-inspired warm aesthetic** blended with immersive tracking views.

---

## Design Reference Analysis (Parley Screenshots)

The 5 Parley reference images establish a clear design language that we'll adapt for RailGaadi:

| Parley Element | RailGaadi Adaptation |
|---|---|
| Warm cream background (`#F5F0EB`) | Home/landing pages use warm cream; tracking pages transition to deeper tones |
| Orange accent (`#EA580C`) | Primary accent for CTAs, active states, and brand elements |
| Clean serif + sans-serif typography | Inter for body, optional serif for hero headings |
| Minimal flat cards on light gray | Glass-effect cards with subtle borders, matching warm palette |
| Generous whitespace, spacious layouts | 8px grid, 24px card padding, 48px section spacing |
| Horizontal scrolling testimonial cards | Horizontal scrolling train cards, recent searches |
| Dark CTA button with orange icon | Dark pill buttons with orange accent icon |
| Dot-separated navigation links | Clean top navbar with minimal separators |
| Small orange decorative squares | Train-themed decorative elements (dots along route lines) |
| Large centered headings with italic accent | Hero headings with gradient or italic accent text |
| Multi-column footer with social links | RailGaadi footer with train info, links, social |

---

## Tech Stack (Confirmed)

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR, routing, API routes |
| Language | **TypeScript** | Type safety |
| Styling | **TailwindCSS v4** | CSS-first config |
| Components | **shadcn/ui** | Base UI primitives |
| Auth | **NextAuth.js v5** (beta) | Google + GitHub login |
| State | **Zustand** | Client state (favorites, theme) |
| Data Fetching | **TanStack Query** | Caching, auto-refresh |
| Maps | **MapTiler SDK** + **MapLibre GL JS** | Premium map tiles & interaction |
| Geospatial | **Turf.js** | Route interpolation, distances |
| Charts | **Recharts** | Delay, elevation, analytics charts |
| Animation | **Framer Motion** | Page transitions, micro-animations |
| Icons | **Lucide React** | Consistent icon set |

---

## External APIs (All Keys Available)

| API | Endpoint | Purpose | Cache Strategy |
|---|---|---|---|
| **RailRadar** | `https://api.railradar.in/v1` | Train search, live status, route geometry | Search: 5min, Live: 10s, Route: 1hr |
| **MapTiler** | `https://api.maptiler.com/maps/` | Map tiles (Streets, Dark, Satellite) | Tile cache built-in |
| **OpenWeatherMap** | `https://api.openweathermap.org/data/2.5` | Current weather at station locations | 30min |
| **Open Topo Data** | `https://api.opentopodata.org/v1` | Elevation data along route | 1hr |
| **Overpass** | `https://overpass-api.de/api/interpreter` | Nearby rivers, mountains, bridges, tunnels | 1hr |
| **Turf.js** | Client-side library | Point-along-line, distances, interpolation | N/A |

---

## Color System

### Light Mode (Parley-Warm)
```
Background:        #F5F0EB (warm cream)
Surface:           #FFFFFF (white cards)
Surface Alt:       #F0EBE3 (warm gray)
Text Primary:      #1A1A1A (near-black)
Text Secondary:    #6B6B6B (warm gray)
Text Muted:        #9B9B9B
Accent Primary:    #EA580C (Parley orange)
Accent Hover:      #DC4A04
Accent Blue:       #2563EB (tracking/map context)
Success:           #16A34A
Warning:           #F59E0B
Error:             #DC2626
Border:            #E8E0D8 (warm border)
```

### Dark Mode (Deep Navy)
```
Background:        #0C0F1A (deep navy)
Surface:           #1A1F35 (dark card)
Surface Alt:       #141829
Text Primary:      #F0EBE3 (warm white)
Text Secondary:    #9B9B9B
Text Muted:        #6B6B6B
Accent Primary:    #F97316 (bright orange)
Accent Blue:       #3B82F6
Success:           #22C55E
Warning:           #FBBF24
Error:             #EF4444
Border:            #2A2F45
```

### Tracking Page (Blended — Deeper Tones)
- Light: Slightly cooler `#F1F5F9` background with blue accents for status cards
- Dark: Deep navy `#0C0F1A` with glowing blue/orange accents
- Map: Always dark (MapTiler `darkmatter` style)

---

## Proposed Changes

### Phase 1: Project Scaffold & Configuration

#### [NEW] Project Initialization

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
npx shadcn@latest init
```

#### [NEW] Dependencies

```bash
# Core
npm install @maptiler/sdk maplibre-gl @tanstack/react-query zustand framer-motion recharts

# Auth
npm install next-auth@beta

# Geo & Data
npm install @turf/turf @turf/along @turf/length @turf/line-slice @turf/bearing

# UI Utilities
npm install lucide-react clsx tailwind-merge

# Dev
npm install -D @types/geojson
```

#### [NEW] shadcn/ui Components (via CLI)

```bash
npx shadcn@latest add button input card badge dialog sheet tooltip skeleton separator
npx shadcn@latest add dropdown-menu avatar tabs scroll-area
```

#### [NEW] `.env.local`

```env
# RailRadar
RAILRADAR_API_KEY=rr_live_YOUR_KEY
NEXT_PUBLIC_RAILRADAR_BASE=https://api.railradar.in/v1

# MapTiler
NEXT_PUBLIC_MAPTILER_KEY=YOUR_MAPTILER_KEY

# OpenWeatherMap
OPENWEATHER_API_KEY=YOUR_KEY

# Open Topo Data (no key needed for public API)
OPENTOPO_BASE=https://api.opentopodata.org/v1

# Auth
AUTH_SECRET=generated_secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### [NEW] Folder Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout
│   ├── page.tsx                            # Home
│   ├── tracking/[trainNo]/page.tsx         # Tracking
│   ├── favorites/page.tsx                  # Saved trains
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts     # NextAuth
│   │   ├── trains/search/route.ts          # Search proxy
│   │   ├── trains/[trainNo]/live/route.ts  # Live status proxy
│   │   ├── trains/[trainNo]/route/route.ts # Route geometry proxy
│   │   ├── weather/route.ts                # Weather proxy
│   │   ├── elevation/route.ts              # Elevation proxy
│   │   └── nearby/route.ts                 # Overpass proxy
├── components/
│   ├── ui/                                 # shadcn/ui components (auto-generated)
│   ├── layout/                             # Navbar, BottomNav, Footer, ThemeSwitcher
│   └── shared/                             # ErrorState, EmptyState, LoadingSpinner
├── features/
│   ├── search/                             # SearchBar, Suggestions, TrainCard
│   ├── tracking/                           # StatusCards, Progress, Timeline
│   ├── map/                                # JourneyMap, AnimatedMarker, Controls
│   ├── analytics/                          # Charts, ProgressRing, Stats
│   ├── weather/                            # WeatherCards, Forecast
│   └── nearby/                             # NearbyPlaces, POI cards
├── hooks/                                  # Shared hooks
├── services/                               # API clients
├── store/                                  # Zustand stores
├── types/                                  # TypeScript types
├── lib/                                    # Utilities
├── providers/                              # Query, Theme, Session providers
└── auth.ts                                 # NextAuth config (root-level)
```

---

### Phase 2: Design System

#### [MODIFY] `src/app/globals.css`
Tailwind v4 CSS-first configuration:
- `@import "tailwindcss"` base import
- `@theme` directive defining all design tokens:
  - Warm cream color palette (light mode)
  - Deep navy color palette (dark mode)
  - Tracking-specific blue accent colors
  - Font family (Inter via Google Fonts import)
  - Border radius tokens (8, 12, 16, 24px)
  - Shadow tokens (subtle warm shadows)
  - Animation keyframes (fade-in, slide-up, scale-in, shimmer, pulse-dot)
- Utility classes:
  - `.glass-card` — frosted glass card effect
  - `.glass-nav` — frosted navigation bar
  - `.warm-gradient` — warm cream gradient background
  - `.tracking-gradient` — cooler tracking page gradient
- Custom scrollbar styling (thin, warm-toned)
- Smooth scroll behavior
- `prefers-reduced-motion` overrides

#### [MODIFY] `src/app/layout.tsx`
Root layout:
- Google Fonts import (Inter 400, 500, 600, 700)
- `<html>` with `suppressHydrationWarning` for dark mode
- Wrap with providers (Session → Theme → QueryClient)
- Navbar component
- Bottom nav (mobile only)
- SEO meta tags, Open Graph
- `className` toggling for dark mode via Zustand store

---

### Phase 3: Core Infrastructure

#### [NEW] `src/types/train.ts`
```typescript
interface Train {
  id: string;
  number: string;
  name: string;
  source: Station;
  destination: Station;
  type: 'Rajdhani' | 'Shatabdi' | 'Duronto' | 'Express' | 'SuperFast' | 'Mail' | 'Local';
  days: string[]; // ['Mon', 'Wed', 'Fri']
}
```

#### [NEW] `src/types/live-status.ts`
```typescript
interface LiveStatus {
  trainNumber: string;
  currentLocation: { lat: number; lng: number };
  speed: number;
  delay: number; // minutes, negative = early
  currentStation: Station;
  nextStation: Station;
  lastStation: Station;
  eta: string; // ISO timestamp
  progress: number; // 0-100
  distanceCovered: number; // km
  distanceRemaining: number; // km
  status: 'running' | 'not-started' | 'completed' | 'cancelled' | 'delayed';
  updatedAt: string;
  stationStatuses: StationStatus[];
}
```

#### [NEW] `src/types/route.ts`
```typescript
interface RouteData {
  polyline: GeoJSON.Feature<GeoJSON.LineString>;
  stations: Station[];
  totalDistance: number;
  completedPolyline: GeoJSON.Feature<GeoJSON.LineString>;
  remainingPolyline: GeoJSON.Feature<GeoJSON.LineString>;
}
```

#### [NEW] `src/types/weather.ts`, `src/types/elevation.ts`, `src/types/nearby.ts`
Weather, elevation profile, and nearby POI type definitions.

#### [NEW] `src/services/railradar.ts`
RailRadar API client:
- `searchTrains(query)` → `GET /v1/trains?q={query}` (with header `Authorization: Bearer {key}`)
- `getLiveStatus(trainNo)` → `GET /v1/trains/{number}/live`
- `getRoute(trainNo)` → `GET /v1/trains/{number}/route`
- Error handling, retries (3 attempts with exponential backoff)
- Request timeout (5s)

#### [NEW] `src/services/weather.ts`
OpenWeatherMap client:
- `getWeather(lat, lng)` → `GET /data/2.5/weather?lat={}&lon={}&appid={key}&units=metric`

#### [NEW] `src/services/elevation.ts`
Open Topo Data client:
- `getElevationProfile(coordinates[])` → `POST /v1/srtm30m` with locations array
- Sample 50-100 points along route for smooth chart

#### [NEW] `src/services/nearby.ts`
Overpass API client:
- `getNearbyPlaces(lat, lng, radius)` — Builds Overpass QL query for rivers, mountains, bridges, tunnels, tourist spots
- Parses OSM response into typed POI objects

#### [NEW] `src/services/mock-data.ts`
Comprehensive fallback data:
- 25+ popular Indian trains (Rajdhani, Shatabdi, Duronto, etc.)
- Realistic station data with lat/lng for major routes
- GeoJSON polylines for Delhi-Mumbai, Howrah-Chennai, Bangalore-Mysore
- Mock live status with interpolated positions
- Mock weather, elevation, nearby places

#### [NEW] `src/store/favorites.ts`
Zustand store — persisted to `localStorage` initially, synced to server when authenticated.

#### [NEW] `src/store/recent-searches.ts`
Zustand store — max 10 recent searches, persisted to `localStorage`.

#### [NEW] `src/store/theme.ts`
Zustand store — light/dark/system, applies `dark` class to `<html>`.

#### [NEW] `src/hooks/useDebounce.ts` — 300ms debounce
#### [NEW] `src/hooks/useMediaQuery.ts` — Breakpoint detection
#### [NEW] `src/hooks/useLocalStorage.ts` — Type-safe localStorage

#### [NEW] `src/lib/utils.ts`
- `cn()` — clsx + tailwind-merge
- `formatDelay()`, `formatDistance()`, `formatTime()`, `formatDuration()`
- `calculateProgress()`
- `getStatusColor()` — Returns color class based on train status

#### [NEW] `src/lib/constants.ts`
- API base URLs, cache durations, refresh intervals
- Train type colors, status colors
- Map default center (India: `[78.9629, 20.5937]`), default zoom

#### [NEW] `src/providers/query-provider.tsx`
TanStack Query with:
- Default `staleTime: 30_000`
- `retry: 3`
- DevTools in development

#### [NEW] `src/providers/theme-provider.tsx`
Reads Zustand theme store, applies `dark` class, listens to `prefers-color-scheme`.

#### [NEW] `src/providers/session-provider.tsx`
NextAuth `SessionProvider` wrapper.

---

### Phase 4: Authentication

#### [NEW] `src/auth.ts` (project root)
NextAuth v5 configuration:
- Google provider
- GitHub provider
- JWT strategy (no database needed for MVP)
- Callbacks: `jwt` and `session` to pass user data

#### [NEW] `src/app/api/auth/[...nextauth]/route.ts`
Export `GET` and `POST` handlers from `auth.ts`.

#### [NEW] `src/components/layout/user-menu.tsx`
- Logged in: Avatar dropdown with name, email, sign out
- Logged out: "Sign In" button → opens modal with Google/GitHub options
- Framer Motion dropdown animation

---

### Phase 5: Shared UI Components & Layout

#### [NEW] `src/components/layout/navbar.tsx`
Parley-inspired navbar:
- Logo "RailGaadi" (bold, left-aligned)
- Nav links: Home • Track • Favorites (dot-separated, like Parley)
- Right: Theme switcher + User menu/Sign In
- Glassmorphism background with warm border-bottom
- Sticky top, `backdrop-blur-lg`
- Mobile: Hamburger menu → slide-in drawer

#### [NEW] `src/components/layout/bottom-nav.tsx`
Mobile-only (hidden on `md:`):
- 4 tabs: Home (🏠), Track (🚂), Analytics (📊), Saved (⭐)
- Active tab: orange accent with label
- Framer Motion spring animation on tab switch
- Safe area padding for notched phones

#### [NEW] `src/components/layout/footer.tsx`
Parley-style footer:
- Logo + tagline
- Column links: Features, Company, Legal
- Social icons row
- Copyright
- Decorative orange squares (like Parley) as train dots

#### [NEW] `src/components/layout/theme-switcher.tsx`
Sun ↔ Moon icon toggle:
- Framer Motion rotation + scale animation
- `useThemeStore` integration

#### [NEW] `src/components/shared/empty-state.tsx`
Centered illustration + message + CTA button. Used for "No trains found", "No favorites yet".

#### [NEW] `src/components/shared/error-state.tsx`
Error message + retry button with Framer Motion shake animation.

#### [NEW] `src/components/shared/loading-spinner.tsx`
Train-themed loading animation (train moving along dots).

#### [NEW] `src/components/shared/share-button.tsx`
Web Share API with clipboard fallback + toast notification.

---

### Phase 6: Home Page & Search

#### [NEW] `src/features/search/components/hero-search.tsx`
Central hero section (Parley-style large centered layout):
- Large heading: "Track Your Train" with italic accent: *"in real time"*
- Subheading in muted text
- Full-width search input with train icon + animated border on focus
- Keyboard shortcut hint (`Press / to search`)
- Background: warm cream gradient with subtle decorative elements

#### [NEW] `src/features/search/components/search-bar.tsx`
The actual input component:
- Large, rounded, warm-bordered
- Search icon (left), clear button (right), loading spinner
- Debounced (300ms) via `useDebounce`
- Focus animation: slight scale + border color change (orange)
- `"/"` keyboard shortcut to focus

#### [NEW] `src/features/search/components/search-suggestions.tsx`
Dropdown below search bar (AnimatePresence):
- Matching trains section (max 5)
- Recent searches section (with clock icon)
- Popular trains section
- Keyboard nav (↑↓ Enter Esc)
- Each item shows: train number, name, source→destination
- Click/Enter navigates to `/tracking/[trainNo]`

#### [NEW] `src/features/search/components/train-result-card.tsx`
Search result card (Parley card style — minimal, flat, warm border):
- Train name (bold) + number (badge)
- Source → Destination with arrow icon
- Type badge (colored: Rajdhani=red, Shatabdi=blue, etc.)
- Running days as small badges
- Hover: subtle lift + warm shadow
- Click → navigate to tracking page

#### [NEW] `src/features/search/components/recent-searches.tsx`
Horizontal scroll section (like Parley testimonials):
- Cards with clock icon, search keyword, timestamp
- Click re-triggers search
- "Clear all" link
- Framer Motion stagger on load

#### [NEW] `src/features/search/components/favorite-trains.tsx`
Grid of saved train cards:
- Train name + number
- Source → Destination
- Remove (heart toggle)
- Click → tracking page
- Empty state if none saved

#### [NEW] `src/features/search/hooks/useTrainSearch.ts`
TanStack Query hook:
- `useQuery` with debounced search term
- Falls back to mock data if API fails
- `enabled: query.length >= 2`

#### [MODIFY] `src/app/page.tsx`
Home page composition:
1. Navbar (sticky)
2. Hero Search section (full viewport height, centered)
3. Recent Searches (horizontal scroll)
4. Favorite Trains (grid)
5. Features showcase section (like Parley's feature blocks)
6. Footer
7. Bottom Nav (mobile)
- Framer Motion stagger animations for sections
- SEO: title "RailGaadi — Track Your Train Journey in Real Time"

---

### Phase 7: Live Tracking Page

#### [NEW] `src/features/tracking/components/train-header.tsx`
Top banner:
- Train name (large, bold) + number (badge)
- Source → Destination with time
- Status badge: Running (green pulse) / Delayed (orange) / Cancelled (red) / Not Started (gray)
- Last updated: "Updated 5s ago" with animated pulse dot
- Actions: ❤️ Favorite toggle + 📤 Share button
- Warm background with subtle gradient

#### [NEW] `src/features/tracking/components/status-cards.tsx`
2×3 grid on desktop, horizontal scroll on mobile:
- **Current Station** — name, platform, arrival time
- **Next Station** — name, ETA, distance
- **Delay** — "+15 min" color-coded (green/orange/red)
- **Speed** — current speed in km/h
- **Distance** — covered / total with mini progress bar
- **Progress** — animated ProgressRing (donut)
- Each card: shadcn Card + warm styling + Framer Motion `useSpring` for animated counters

#### [NEW] `src/features/tracking/components/journey-progress.tsx`
Full-width horizontal progress visualization:
- Source (left) → Destination (right)
- Completed segment: orange gradient line
- Remaining segment: dashed gray line
- Station dots along the line (visited = filled, upcoming = outlined)
- Animated train icon at current position (CSS keyframe slide)
- Current position label above train
- Responsive: wraps nicely on mobile

#### [NEW] `src/features/tracking/components/station-timeline.tsx`
Vertical scrollable timeline:
- Each station: time (left) — dot — name + details (right)
- Visited: green dot with checkmark
- Current: pulsing orange dot (larger)
- Upcoming: gray outlined dot
- Delay shown inline: "+5 min" in orange
- Platform number badge
- Auto-scroll to current station on load
- Framer Motion stagger for station items

#### [NEW] `src/features/tracking/hooks/useTracking.ts`
TanStack Query hook:
- `useQuery(['tracking', trainNo], getLiveStatus, { refetchInterval: 15000 })`
- Auto-refresh every 15 seconds
- Error retry (3 attempts)
- `onSuccess` callback to update Zustand store

#### [NEW] `src/features/tracking/hooks/useJourney.ts`
Combines live status + route data:
- Computes completed/remaining polylines using Turf.js `lineSlice`
- Calculates train's interpolated position along route
- Computes bearing/heading for marker rotation
- Returns unified `JourneyState` object

#### [MODIFY] `src/app/tracking/[trainNo]/page.tsx`
Tracking page layout (scrollable single page):
1. Train Header
2. Status Cards
3. Journey Map (60vh, full-width)
4. Journey Progress Bar
5. Station Timeline
6. Analytics Section (tabs)
7. Weather Section
8. Nearby Places Section
- Page background: cooler tone (`#F1F5F9` light / `#0C0F1A` dark)
- Loading state: full skeleton layout matching each component
- Error state: retry card
- SEO: dynamic title "Train {number} — {name} | RailGaadi"

---

### Phase 8: Interactive MapTiler Map

#### [NEW] `src/features/map/components/journey-map.tsx`
Full MapTiler/MapLibre map:
- **Style**: MapTiler `darkmatter` (always dark for immersive feel)
- **Initial view**: Fit bounds to full route with padding
- **Route layers**:
  - Completed route: solid orange line (3px) with glow (wider translucent line behind)
  - Remaining route: dashed gray line (2px)
- **Station markers**: Small circles on route (visited = orange filled, upcoming = gray outlined)
- **Train marker**: Custom HTML overlay (animated train icon with pulse ring)
- **Interactions**: Click station → popup with details
- **Responsive**: 60vh desktop, 50vh mobile, rounded corners
- Dynamic import with `ssr: false` for client-only rendering
- Cleanup on unmount

#### [NEW] `src/features/map/components/animated-marker.tsx`
Custom MapLibre marker:
- Train icon (🚂 or SVG)
- CSS pulse ring animation (concentric expanding circles)
- Rotation based on bearing (from Turf.js)
- Smooth position interpolation (CSS transition on transform)

#### [NEW] `src/features/map/components/floating-controls.tsx`
Overlay control panel (bottom-right, glassmorphism):
- Zoom in (+) / Zoom out (-)
- Reset north (compass icon)
- Locate train (crosshair icon) — fly to train position
- Follow mode toggle (when ON, camera tracks train)
- Fullscreen toggle
- Each button: rounded, glass background, hover orange border

#### [NEW] `src/features/map/components/station-popup.tsx`
Custom popup when clicking a station marker:
- Station name + code
- Scheduled arrival/departure
- Actual arrival (if passed)
- Delay
- Platform
- Distance from source
- Warm styling matching app theme

#### [NEW] `src/features/map/hooks/useMapCamera.ts`
Camera management:
- `followMode`: camera smoothly flies to train position on each update
- `manualMode`: user can pan/zoom freely; disables follow
- `fitRoute()`: fits camera to show entire route
- `flyToTrain()`: smooth fly-to animation to current train position
- `flyToStation(station)`: fly to clicked station

---

### Phase 9: Analytics Dashboard

#### [NEW] `src/features/analytics/components/analytics-section.tsx`
Tabbed section container:
- Tab 1: **Overview** (stats cards + progress donut)
- Tab 2: **Delay Trend** (area chart)
- Tab 3: **Elevation** (elevation profile chart)
- Tab 4: **Timeline** (arrival timeline)
- shadcn Tabs with orange active indicator
- Framer Motion tab content transition

#### [NEW] `src/features/analytics/components/journey-stats.tsx`
Statistics cards (2×3 grid):
- Total Distance
- Distance Covered
- Distance Remaining
- Average Speed
- Stops Completed / Total
- Estimated Arrival
- Each with: icon, label, animated counter (Framer Motion `useSpring`), unit

#### [NEW] `src/features/analytics/components/progress-donut.tsx`
Animated SVG donut:
- Journey completion percentage (center text)
- Animated arc fill on load
- Color gradient: gray → orange → green as progress increases
- Framer Motion spring animation

#### [NEW] `src/features/analytics/components/delay-chart.tsx`
Recharts AreaChart:
- X-axis: station names (abbreviated)
- Y-axis: delay in minutes
- Area fill: green (on time) → orange (moderate) → red (heavy delay)
- Tooltip showing station name + exact delay
- Responsive container
- Warm grid lines

#### [NEW] `src/features/analytics/components/elevation-chart.tsx`
Recharts AreaChart (elevation profile):
- X-axis: distance along route (km)
- Y-axis: elevation (meters)
- Gradient fill matching terrain colors
- Current train position marker (vertical line)
- Highest point annotation
- Tooltip: distance, elevation, nearby station
- Data from Open Topo Data API

#### [NEW] `src/features/analytics/components/arrival-timeline.tsx`
Horizontal timeline comparing scheduled vs actual:
- Station dots with lines connecting
- Green = on time, Orange = delayed, Blue = early
- Hover for details
- Scrollable on mobile

#### [NEW] `src/features/analytics/hooks/useElevation.ts`
TanStack Query hook:
- Takes route polyline coordinates
- Samples 80 points along route using Turf.js `along()`
- Fetches elevation for each point from Open Topo Data
- Returns `ElevationPoint[]` for chart
- Cache: 1 hour (elevation doesn't change)

---

### Phase 10: Weather Companion & Nearby Places

#### [NEW] `src/features/weather/components/weather-section.tsx`
Three weather cards in a row (horizontal scroll on mobile):
- **Current Station** — temp, humidity, wind, conditions icon, description
- **Next Station** — same format
- **Destination** — same format
- Each card: warm glass styling, weather emoji, animated temperature counter
- Rain probability highlighted with special styling

#### [NEW] `src/features/weather/components/weather-card.tsx`
Individual weather card:
- Station name + "Current location" / "Next stop" / "Destination" label
- Large temperature with °C
- Weather icon (mapped from OWM icon codes)
- Humidity, wind speed, rain chance
- Warm background gradient based on weather (sunny=warm, rainy=cool, etc.)

#### [NEW] `src/features/weather/hooks/useWeather.ts`
TanStack Query hook:
- Fetches weather for 3 stations (current, next, destination)
- `useQueries()` for parallel fetching
- Cache: 30 minutes
- Returns `WeatherData[]`

#### [NEW] `src/features/nearby/components/nearby-section.tsx`
Section showing places near the train's current position:
- Category tabs: Rivers | Mountains | Bridges | Tunnels | Tourist Spots
- Grid of POI cards
- Each card: name, type icon, distance from train, description
- Empty state per category if none found
- Framer Motion stagger animation

#### [NEW] `src/features/nearby/components/poi-card.tsx`
Individual POI card:
- Icon (river, mountain, bridge, tunnel, camera)
- Name
- Distance: "2.3 km away"
- Type badge
- Optional: click to view on map (scroll to map + fly to location)

#### [NEW] `src/features/nearby/hooks/useNearbyPlaces.ts`
TanStack Query hook:
- Takes current train lat/lng
- Calls Overpass API via `/api/nearby` proxy
- Parses OSM elements into typed POI objects
- Cache: 1 hour
- `refetchInterval: 60000` (refresh every 60s as train moves)

---

## API Routes (Next.js Backend)

All API routes act as **proxies** to protect API keys (server-side only).

### [NEW] `src/app/api/trains/search/route.ts`
- `GET ?q=query`
- Proxies to RailRadar `/v1/trains?q={query}`
- In-memory cache (Map with TTL: 5 minutes)
- Fallback to mock data
- Input validation

### [NEW] `src/app/api/trains/[trainNo]/live/route.ts`
- `GET`
- Proxies to RailRadar `/v1/trains/{number}/live`
- Cache: 10 seconds
- Retry: 3 attempts
- Fallback to mock interpolated position

### [NEW] `src/app/api/trains/[trainNo]/route/route.ts`
- `GET`
- Proxies to RailRadar `/v1/trains/{number}/route`
- Cache: 1 hour
- Returns GeoJSON polyline + stations

### [NEW] `src/app/api/weather/route.ts`
- `GET ?lat=&lng=`
- Proxies to OpenWeatherMap
- Cache: 30 minutes

### [NEW] `src/app/api/elevation/route.ts`
- `POST` with `{ coordinates: [lat, lng][] }`
- Proxies to Open Topo Data `/v1/srtm30m`
- Cache: 1 hour

### [NEW] `src/app/api/nearby/route.ts`
- `GET ?lat=&lng=&radius=5000`
- Builds Overpass QL query
- Proxies to Overpass API
- Parses response into typed objects
- Cache: 1 hour

---

## File Count Summary

| Category | Files | Key Files |
|---|---|---|
| Config & Setup | 6 | `.env.local`, `globals.css`, `auth.ts`, `next.config.js`, `components.json` |
| Types | 6 | `train.ts`, `live-status.ts`, `route.ts`, `weather.ts`, `elevation.ts`, `nearby.ts` |
| Services | 5 | `railradar.ts`, `weather.ts`, `elevation.ts`, `nearby.ts`, `mock-data.ts` |
| Stores | 3 | `favorites.ts`, `recent-searches.ts`, `theme.ts` |
| Providers | 3 | `query-provider.tsx`, `theme-provider.tsx`, `session-provider.tsx` |
| Hooks (Shared) | 3 | `useDebounce.ts`, `useMediaQuery.ts`, `useLocalStorage.ts` |
| Hooks (Feature) | 7 | `useTrainSearch`, `useTracking`, `useJourney`, `useMapCamera`, `useElevation`, `useWeather`, `useNearbyPlaces` |
| Layout Components | 5 | `navbar.tsx`, `bottom-nav.tsx`, `footer.tsx`, `theme-switcher.tsx`, `user-menu.tsx` |
| Shared Components | 4 | `empty-state.tsx`, `error-state.tsx`, `loading-spinner.tsx`, `share-button.tsx` |
| shadcn/ui Components | ~14 | Auto-generated via CLI |
| Search Feature | 6 | `hero-search`, `search-bar`, `suggestions`, `train-result-card`, `recent-searches`, `favorite-trains` |
| Tracking Feature | 5 | `train-header`, `status-cards`, `journey-progress`, `station-timeline` |
| Map Feature | 4 | `journey-map`, `animated-marker`, `floating-controls`, `station-popup` |
| Analytics Feature | 6 | `analytics-section`, `journey-stats`, `progress-donut`, `delay-chart`, `elevation-chart`, `arrival-timeline` |
| Weather Feature | 2 | `weather-section`, `weather-card` |
| Nearby Feature | 2 | `nearby-section`, `poi-card` |
| API Routes | 6 | `search`, `live`, `route`, `weather`, `elevation`, `nearby` |
| Pages | 3 | `page.tsx` (home), `tracking/[trainNo]/page.tsx`, `favorites/page.tsx` |
| Lib / Utils | 2 | `utils.ts`, `constants.ts` |
| **Total** | **~85 files** | |

---

## Verification Plan

### Automated Tests
```bash
npm run build              # TypeScript + Next.js compilation
npm run lint               # ESLint
```

### Manual Verification
- **Home Page**: Hero search works, suggestions appear, recent searches display, favorites toggle
- **Search**: Debounced input, keyboard navigation (↑↓ Enter), results load from mock/API
- **Tracking**: All 6 status cards render, auto-refresh indicator, station timeline scrolls
- **Map**: MapTiler loads with dark style, route polyline renders, train marker animates, floating controls work
- **Analytics**: All charts render (delay, elevation, progress donut), animated counters
- **Weather**: 3 weather cards load, temperature/conditions display
- **Nearby**: Overpass data renders in categorized cards
- **Auth**: Google/GitHub sign-in flow, user menu, favorites persist
- **Dark Mode**: Full toggle works, all components adapt, map stays dark
- **Responsive**: Test at 375px, 768px, 1440px — all layouts adapt
- **Performance**: Home page < 2s load, map < 2s load, 60fps animations
- **Accessibility**: Keyboard navigation, ARIA labels, focus states, contrast ratio

### Browser Recording
Full flow capture: Home → Search → Select Train → Tracking → Map → Analytics → Weather → Share

---

> [!TIP]
> **Execution Order**: I'll build phases 1→10 sequentially. The app will be visually functional from Phase 6 onward (with mock data). Real API integration works from Phase 3 if you configure `.env.local` with your keys.
