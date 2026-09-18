import type { Metadata, Viewport } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { SessionProvider } from "@/providers/session-provider";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ed" },
    { media: "(prefers-color-scheme: dark)", color: "#08090f" },
  ],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
});

/** Display face for headlines — referenced by `--font-display` in globals.css. */
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["600", "700", "800"],
  display: "swap",
});

/** Tabular face for train numbers, codes and map labels. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RailGaadi — Track Your Train Journey in Real Time",
    template: "%s | RailGaadi",
  },
  description:
    "Premium real-time train journey visualization platform. Track trains live, explore interactive maps, analyze journey progress, and discover places along the route.",
  keywords: [
    "train tracking",
    "Indian Railways",
    "live train status",
    "journey map",
    "train analytics",
    "RailGaadi",
  ],
  authors: [{ name: "RailGaadi" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "RailGaadi",
    title: "RailGaadi — Track Your Train Journey in Real Time",
    description:
      "Premium real-time train journey visualization. Interactive maps, analytics, and live tracking.",
  },
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const headerList = await headers();
  const nonce = headerList.get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          nonce={nonce}
        >
          {`
            try {
              const stored = JSON.parse(localStorage.getItem('railgaadi-theme') || '{}');
              const theme = stored?.state?.theme || 'system';
              const resolved = theme === 'system'
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : theme;
              document.documentElement.classList.add(resolved);
            } catch(e) {}
          `}
        </Script>
        <link rel="preconnect" href="https://api.maptiler.com" />
        <link rel="preconnect" href="https://basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://api.maptiler.com" />
        <link rel="dns-prefetch" href="https://basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://a.tiles.openrailwaymap.org" />
        <link rel="dns-prefetch" href="https://b.tiles.openrailwaymap.org" />
        <link rel="dns-prefetch" href="https://c.tiles.openrailwaymap.org" />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased"
        suppressHydrationWarning
      >
        <SessionProvider>
          <QueryProvider>
            <ThemeProvider>
              <MotionConfig reducedMotion="user">{children}</MotionConfig>
              <Analytics />
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
