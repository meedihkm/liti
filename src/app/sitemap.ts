import type { MetadataRoute } from "next";

// Sitemap — le site est une SPA hash-routée depuis la route unique « / ».
// Les fragments (#/catalog…) ne constituent pas des URL séparées pour les
// crawlers : on déclare la racine + les fichiers statiques clés.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    {
      url: base + "/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
