import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "weather-cache",
        expiration: { maxEntries: 10, maxAgeSeconds: 3600 },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "map-tiles",
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 * 30 },
      },
    },
  ],
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
