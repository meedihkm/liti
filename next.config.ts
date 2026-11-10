import type { NextConfig } from "next";

// En-têtes de sécurité appliqués à toutes les réponses
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Domaines de preview de la plateforme autorisés à charger les
  // ressources /_next/* (chunks, HMR) depuis le serveur de dev.
  // Sans ça : « Requête cross-origin refusée » dans le preview.
  allowedDevOrigins: ["*.space-z.ai", "*.z.ai"],
  images: {
    // Qualités utilisées par SmartImage (82 par défaut, réduites pour vignettes)
    qualities: [50, 55, 60, 75, 82],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.myrobe-giize.com',
      },
    ],
  },
  // /admin tapé directement dans la barre d'URL → SPA #/admin (anti-404)
  async redirects() {
    return [
      { source: "/admin", destination: "/#/admin", permanent: false },
      { source: "/admin/:path*", destination: "/#/admin", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Content-Type", value: "application/manifest+json; charset=utf-8" }],
      },
    ];
  },
};

export default nextConfig;
