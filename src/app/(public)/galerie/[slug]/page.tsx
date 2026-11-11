import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await db.gallery.findUnique({
    where: { slug },
  });

  if (!gallery) {
    return {
      title: 'Galerie introuvable | Taqendurt',
    };
  }

  return {
    title: `${gallery.title} | Galerie Taqendurt`,
    description: gallery.description || 'Découvrez notre collection',
    openGraph: gallery.coverImage
      ? {
          images: [gallery.coverImage],
        }
      : undefined,
  };
}

// Force dynamic rendering - no static generation during build
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GalleryDetailPage({ params }: Props) {
  const { slug } = await params;

  const gallery = await db.gallery.findUnique({
    where: { slug, visible: true },
    include: {
      images: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!gallery) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/galerie"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour à la galerie
          </Link>
        </div>

        <div className="space-y-6 mb-12">
          <div className="flex items-center gap-3">
            <span className="px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {gallery.type === 'lookbook' && 'Lookbook'}
              {gallery.type === 'collection' && 'Collection'}
              {gallery.type === 'inspiration' && 'Inspiration'}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold">{gallery.title}</h1>
          {gallery.description && (
            <p className="text-xl text-muted-foreground max-w-3xl">
              {gallery.description}
            </p>
          )}
        </div>
      </section>

      {/* Images Masonry Grid */}
      <section className="px-6 pb-24 max-w-7xl mx-auto">
        {gallery.images.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              Aucune image dans cette galerie
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {gallery.images.map((image, index) => (
              <div
                key={image.id}
                className="break-inside-avoid group relative overflow-hidden rounded-2xl"
              >
                <Image
                  src={image.url}
                  alt={image.alt || `${gallery.title} ${index + 1}`}
                  width={600}
                  height={800}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {(image.caption || image.productId) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                      {image.caption && (
                        <p className="text-white text-lg font-medium">
                          {image.caption}
                        </p>
                      )}
                      {image.productId && (
                        <Link
                          href={`/catalogue/${image.productId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
                        >
                          Voir le produit
                          <svg
                            className="w-4 h-4"
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
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related Galleries */}
      <section className="py-24 px-6 bg-primary/5">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Découvrez aussi
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/galerie"
              className="px-6 py-3 rounded-full border-2 border-primary text-primary font-medium hover:bg-primary/10 transition-colors"
            >
              Toutes les galeries
            </Link>
            <Link
              href="/catalogue"
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Voir le catalogue
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
