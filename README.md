# RailGaadi

A premium real-time train journey visualization platform for Indian Railways. RailGaadi blends a warm, editorial-inspired design with immersive live tracking — search any train, follow its real-time position on an interactive map, and explore route analytics, elevation profiles, weather, and nearby points of interest as the journey unfolds.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [License](#license)
- [Contact Information](#contact-information)

## Project Overview

RailGaadi is a real-time train journey visualization platform for Indian Railways. It provides:

- **Live train tracking** — real-time position, speed, delay, and ETA via the RailRadar API, refreshed every 15 seconds.
- **Interactive journey maps** — rendered with MapTiler/MapLibre, showing completed and remaining route segments, station stops, and an animated train marker.
- **Journey analytics** — delay trends, elevation profiles, progress tracking, and station-by-station timelines.
- **Contextual companions** — current weather at key stations and nearby points of interest (rivers, mountains, bridges, tunnels, tourist spots) along the route.
- **Personalization** — save favorite trains, revisit recent searches, and sign in with Google or GitHub to sync preferences.

The application uses a server-side proxy layer (`src/app/api/*`) so third-party API keys never reach the browser.

## Features

- **Train search** — instant, debounced search across trains with keyboard navigation (`↑`/`↓`/`Enter`/`Esc`), suggestions, and popular train shortcuts.
- **Live status tracking** — a status dashboard covering current/next station, delay, speed, distance covered, and journey progress.
- **Interactive map** — dark-themed route map with completed (solid) vs. remaining (dashed) segments, clickable station markers, follow-mode camera, and zoom/north controls.
- **Journey progress** — a visual source-to-destination progress bar with animated train position and visited/upcoming station dots.
- **Station timeline** — a chronological, auto-scrolling list of all stops with arrival times, delays, and platform numbers.
- **Analytics dashboard** — tabbed charts for journey overview, delay trends, elevation profile, and scheduled-vs-actual arrivals.
- **Weather companion** — current conditions (temperature, humidity, wind, rain chance) at the current station, next stop, and destination.
- **Nearby places** — categorized points of interest near the train's live position via the Overpass API.
- **Favorites & recents** — persisted to `localStorage`, synced to the user's account when authenticated.
- **Authentication** — NextAuth.js (v5) with Google and GitHub OAuth, JWT session strategy.
- **Dark mode** — full light/dark/system theme support; the map stays dark in both modes.
- **Responsive & accessible** — mobile-first layout with a bottom navigation bar, keyboard support, ARIA labels, and reduced-motion handling.

## Tech Stack

| Layer          | Technology                                   | Purpose                                      |
| -------------- | -------------------------------------------- | -------------------------------------------- |
| Framework      | Next.js 16 (App Router)                      | SSR, routing, API routes                     |
| Language       | TypeScript                                   | Type safety                                  |
| Styling        | Tailwind CSS v4 (CSS-first)                  | Design system and theming                    |
| Auth           | NextAuth.js v5 (beta)                        | Google + GitHub sign-in, JWT sessions        |
| Client State   | Zustand                                      | Favorites, recent searches, theme            |
| Data Fetching  | TanStack Query v5                            | Caching, auto-refresh                        |
| Maps           | MapTiler SDK + MapLibre GL                   | Basemaps and map interactions                |
| Geospatial     | Turf.js                                      | Route interpolation, distances, headings     |
| Charts         | Recharts                                     | Delay, elevation, and analytics charts       |
| Animation      | Framer Motion                                | Page transitions and micro-interactions      |
| Icons          | Lucide React                                 | Consistent icon set                          |

## Prerequisites

- **Node.js** 20.9 or later (required by Next.js 16)
- **npm** 10 or later (or `yarn`, `pnpm`, `bun`)
- API keys for [RailRadar](https://api.railradar.in), [MapTiler](https://cloud.maptiler.com), and [OpenWeatherMap](https://openweathermap.org) — see [Configuration](#configuration)
- OAuth app credentials for Google and/or GitHub (optional, for sign-in)

> **Tip:** The app runs without any real API keys by falling back to bundled mock data, which is ideal for local development and UI work.

## Installation Guide

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd railgaadi
npm install
```

## Configuration

Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

> `.env.local` is git-ignored and holds live secrets — never commit it. Only `.env.example` should be committed.

The following variables are supported (see `.env.example` for the full annotated template):

| Variable                     | Required | Description                                                          |
| ---------------------------- | -------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`        | Yes      | Public origin of the deployed app (OG metadata, auth redirects)      |
| `RAILRADAR_API_KEY`          | Optional | RailRadar server-side key (live train data)                          |
| `NEXT_PUBLIC_RAILRADAR_BASE` | No       | Override the default RailRadar upstream base URL                     |
| `NEXT_PUBLIC_MAPTILER_KEY`   | Optional | MapTiler public key (vector basemaps)                                |
| `OPENWEATHER_API_KEY`        | Optional | OpenWeatherMap server-side key (current weather)                     |
| `OPENTOPO_BASE`              | No       | Override the default Open Topo Data base URL                         |
| `AUTH_SECRET`                | Yes      | NextAuth encryption secret — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID`           | Optional | Google OAuth client ID (`''` disables the button)                    |
| `GOOGLE_CLIENT_SECRET`       | Optional | Google OAuth client secret                                           |
| `GITHUB_CLIENT_ID`           | Optional | GitHub OAuth client ID (`''` disables the button)                    |
| `GITHUB_CLIENT_SECRET`       | Optional | GitHub OAuth client secret                                           |

**Security notes:**

- Server-side keys (`RAILRADAR_API_KEY`, `OPENWEATHER_API_KEY`, `AUTH_SECRET`) must never be prefixed with `NEXT_PUBLIC_`.
- Configure domain restrictions on your MapTiler console so the public key only works from your hosts.

## Usage

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app. The home page is hot-reloaded as you edit files under `src/`.

### Scripts

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Start the development server               |
| `npm run build`     | Create a production build                  |
| `npm start`         | Serve the production build locally         |
| `npm run lint`      | Run ESLint                                 |

To verify your changes before shipping:

```bash
npm run lint
npm run build
```

## API Documentation

All API routes live under `src/app/api/` and act as **server-side proxies** that protect third-party API keys from the browser. Responses are cached in-memory with time-based TTLs, and most routes fall back to mock data when the upstream is unavailable.

### Authentication

| Route                                 | Method | Description                          |
| ------------------------------------- | ------ | ------------------------------------ |
| `/api/auth/[...nextauth]`             | GET/POST | NextAuth handlers (sign-in, callback, session, sign-out) |

### Trains

| Route                          | Method | Query / Params  | Description                       | Cache  |
| ------------------------------ | ------ | --------------- | --------------------------------- | ------ |
| `/api/trains/search`           | GET    | `?q=<query>`    | Search trains by name or number   | 5 min  |
| `/api/trains/[trainNo]/live`   | GET    | `[trainNo]`     | Live status for a train           | 10 sec |
| `/api/trains/[trainNo]/route`  | GET    | `[trainNo]`     | Route geometry + stations (GeoJSON) | 1 hour |

### Geospatial & Environment

| Route             | Method | Query / Body                          | Description                         | Cache  |
| ----------------- | ------ | ------------------------------------- | ----------------------------------- | ------ |
| `/api/weather`    | GET    | `?lat=<lat>&lng=<lng>`                | Current weather at a station        | 30 min |
| `/api/elevation`  | POST   | `{ coordinates: [lat, lng][] }`       | Elevation profile along a route     | 1 hour |
| `/api/nearby`     | GET    | `?lat=<lat>&lng=<lng>&radius=<meters>` | Points of interest near a position  | 1 hour |

## Project Structure

```
railgaadi/
├── public/                       # Static assets
├── src/
│   ├── app/                      # App Router pages & API routes
│   │   ├── page.tsx              # Home page (hero search, recents, favorites)
│   │   ├── tracking/[trainNo]/   # Live tracking page
│   │   ├── favorites/            # Saved trains page
│   │   ├── analytics/            # Analytics page
│   │   ├── login/                # Sign-in page
│   │   ├── api/                  # Server-side proxy routes
│   │   │   ├── auth/             # NextAuth handlers
│   │   │   ├── trains/           # Search, live, route proxies
│   │   │   ├── weather/          # OpenWeatherMap proxy
│   │   │   ├── elevation/        # Open Topo Data proxy
│   │   │   └── nearby/           # Overpass API proxy
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Tailwind v4 design tokens
│   ├── components/
│   │   ├── layout/               # Navbar, bottom nav, footer, theme switcher, user menu
│   │   └── shared/               # Error, empty, loading, share states
│   ├── features/
│   │   ├── search/               # Search bar, suggestions, train cards
│   │   ├── tracking/             # Status cards, progress, station timeline
│   │   ├── map/                  # Journey map, markers, floating controls
│   │   ├── analytics/            # Charts and journey statistics
│   │   ├── weather/              # Weather cards and forecast
│   │   └── nearby/               # Nearby places and POI cards
│   ├── hooks/                    # Shared hooks (debounce, media query, storage)
│   ├── services/                 # API clients + mock data fallbacks
│   ├── store/                    # Zustand stores (favorites, recents, theme)
│   ├── types/                    # TypeScript type definitions
│   ├── lib/                      # Utilities and constants
│   ├── providers/                # Query, theme, and session providers
│   └── auth.ts                   # NextAuth configuration
├── .env.example                  # Environment template (safe to commit)
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

## Contributing Guidelines

We welcome contributions. Please follow these guidelines:

1. **Fork & branch** — create a feature branch from `main` (e.g. `feat/live-weather`).
2. **Keep changes focused** — one logical change per pull request.
3. **Follow existing conventions** — TypeScript strict typing, Tailwind v4 design tokens, and the established component patterns under `src/`.
4. **Lint & build before submitting:**
   ```bash
   npm run lint
   npm run build
   ```
5. **Test manually** — verify responsive layouts (375px, 768px, 1440px), dark mode, keyboard navigation, and the map at a few breakpoints.
6. **Write a clear PR description** — explain the problem, the change, and how it was verified.

### Reporting Issues

Open an issue with a clear title, reproduction steps, expected vs. actual behavior, and (if applicable) browser/device details. Include relevant logs and screenshots where helpful.

## License

This project is **private** and not currently licensed for public distribution or reuse. All rights reserved. See the repository owner for licensing inquiries.

## Contact Information

For questions, feedback, or collaboration, contact the project maintainers via the repository's issue tracker or GitHub discussions.
