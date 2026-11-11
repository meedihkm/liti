import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/db';
import { motion } from 'motion/react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Galerie | Taqendurt',
  description: 'Découvrez notre collection de robes kabyles traditionnelles et modernes',
};

export const revalidate = 300; // revalidate every 5 minutes

export default async function GaleriePage() {
  const galleries = await db.gallery.findMany({
    where: { visible: true },
    include: {
      images: {
        orderBy: { order: 'asc' },
        take: 4,
      },
    },
    orderBy: { order: 'asc' },
  });

  const hero = await db.contentBlock.findFirst({
    where: {
      slug: 'gallery-hero',
      visible: true,
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {hero && (
        <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              {hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl">
              {hero.content}
            </p>
          </div>
        </section>
      )}

      {/* Gallery Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        {galleries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground">
              La galerie sera bientôt disponible
            </p>
          </div>
        ) : (
          <div className="space-y-24">
            {galleries.map((gallery, index) => (
              <article key={gallery.id} className="space-y-8">
                {/* Gallery Header */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {gallery.type === 'lookbook' && 'Lookbook'}
                      {gallery.type === 'collection' && 'Collection'}
                      {gallery.type === 'inspiration' && 'Inspiration'}
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold">
                    {gallery.title}
                  </h2>
                  {gallery.description && (
                    <p className="text-lg text-muted-foreground max-w-3xl">
                      {gallery.description}
                    </p>
                  )}
                </div>

                {/* Images Grid */}
                {gallery.images.length > 0 && (
                  <div
                    className={`grid gap-4 ${
                      gallery.images.length === 1
                        ? 'grid-cols-1'
                        : gallery.images.length === 2
                        ? 'grid-cols-1 md:grid-cols-2'
                        : gallery.images.length === 3
                        ? 'grid-cols-1 md:grid-cols-3'
                        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
                    }`}
                  >
                    {gallery.images.map((image, imgIndex) => (
                      <div
                        key={image.id}
                        className={`relative group overflow-hidden rounded-2xl ${
                          imgIndex === 0 && gallery.images.length > 3
                            ? 'md:col-span-2 md:row-span-2'
                            : ''
                        }`}
                        style={{
                          aspectRatio:
                            imgIndex === 0 && gallery.images.length > 3
                              ? '16/9'
                              : '4/5',
                        }}
                      >
                        <Image
                          src={image.url}
                          alt={image.alt || gallery.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {image.caption && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                              <p className="text-white text-lg font-medium">
                                {image.caption}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* View More Link */}
                <div className="pt-4">
                  <Link
                    href={`/galerie/${gallery.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    Voir la collection complète
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Créez votre robe sur-mesure
          </h2>
          <p className="text-xl text-muted-foreground">
            Personnalisez chaque détail : tissu, couleur, broderie, longueur et
            mesures.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/configurateur"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Commencer la création
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/catalogue"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-primary text-primary font-medium hover:bg-primary/10 transition-colors"
            >
              Voir le catalogue
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
