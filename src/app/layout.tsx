import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { HashRouteMigrator } from "@/components/routing/hash-route-migrator";
import { SWRegister } from "@/components/pwa/sw-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";

// Typographies : display moderne large + sans-serif lisible + arabe
const display = Space_Grotesk({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const arabic = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  title: {
    default: "Taqendurt — Robes kabyles traditionnelles & modernes | Algérie",
    template: "%s | Taqendurt",
  },
  description:
    "Boutique de robes kabyles traditionnelles et modernes : robe kabyle, karakou, gandoura, tenues de mariage. Sur-mesure, broderie artisanale, livraison dans les 58 wilayas. Paiement à la livraison.",
  keywords: [
    "robe kabyle",
    "karakou",
    "gandoura",
    "robe mariage algérie",
    "sur mesure",
    "broderie kabyle",
    "tenue traditionnelle",
    "فساتين قبائلية",
  ],
  authors: [{ name: "Taqendurt" }],
  applicationName: "Taqendurt",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Taqendurt",
  },
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    siteName: "Taqendurt",
    title: "Taqendurt — Robes kabyles confectionnées pour vous",
    description:
      "Robes kabyles traditionnelles et modernes, sur-mesure, broderie artisanale. Livraison 58 wilayas, paiement à la livraison.",
    images: [{ url: "/images/og-cover.jpg", width: 1344, height: 768, alt: "Robe kabyle Taqendurt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taqendurt — Robes kabyles",
    description: "Sur-mesure, broderie artisanale, livraison 58 wilayas.",
    images: ["/images/og-cover.jpg"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0d0b" },
    { media: "(prefers-color-scheme: light)", color: "#faf7f0" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" dir="ltr" className="dark" suppressHydrationWarning>
      <head>
        {/* Applique thème + langue mémorisés AVANT la première peinture (anti-flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rk-theme');if(t==='light'){document.documentElement.classList.remove('dark')}var l=localStorage.getItem('rk-lang');if(l==='ar'||l==='fr'){document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr'}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${display.variable} ${body.variable} ${arabic.variable} font-sans antialiased bg-background text-foreground`}
      >
        <HashRouteMigrator />
        <SWRegister />
        <InstallPrompt />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
