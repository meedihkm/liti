import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

// Force dynamic rendering - no static generation during build
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myrobe-giize.com';

  // Static pages
  const staticPages = [
    '',
    '/galerie',
    '/catalogue',
    '/configurateur',
    '/devis',
    '/suivi',
    '/contact',
    '/a-propos',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Products
  const products = await db.product.findMany({
    where: { visible: true },
    select: { id: true, updatedAt: true },
  });

  const productPages = products.map((product) => ({
    url: `${baseUrl}/catalogue/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Galleries
  const galleries = await db.gallery.findMany({
    where: { visible: true },
    select: { slug: true, updatedAt: true },
  });

  const galleryPages = galleries.map((gallery) => ({
    url: `${baseUrl}/galerie/${gallery.slug}`,
    lastModified: gallery.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Blog posts (if any)
  const posts = await db.blogPost.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  const blogPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...productPages, ...galleryPages, ...blogPages];
}
