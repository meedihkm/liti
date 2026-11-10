/**
 * Gallery Seed Script
 * Populates initial gallery and content block data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎨 Seeding gallery data...');

  // Create hero content block for gallery page
  const hero = await prisma.contentBlock.upsert({
    where: { slug: 'gallery-hero' },
    update: {},
    create: {
      slug: 'gallery-hero',
      title: 'Notre Galerie',
      titleAr: 'معرضنا',
      content: 'Découvrez l\'art de la robe kabyle à travers nos collections',
      contentAr: 'اكتشفوا فن الفستان القبائلي من خلال مجموعاتنا',
      type: 'hero',
      visible: true,
      order: 0,
    },
  });

  console.log(`✅ Created content block: ${hero.slug}`);

  // Create sample gallery collections
  const galleries = [
    {
      slug: 'collection-printemps-2026',
      title: 'Collection Printemps 2026',
      titleAr: 'مجموعة ربيع 2026',
      description:
        'Une collection inspirée des couleurs vives et des motifs floraux traditionnels',
      descriptionAr: 'مجموعة مستوحاة من الألوان الزاهية والأنماط الزهرية التقليدية',
      coverImage: '/images/products/p1.jpg',
      type: 'collection',
      visible: true,
      order: 0,
    },
    {
      slug: 'lookbook-mariage',
      title: 'Lookbook Mariage',
      titleAr: 'ألبوم الزفاف',
      description:
        'Nos plus belles créations pour votre jour spécial - robes kabyles de mariage',
      descriptionAr: 'أجمل إبداعاتنا ليومك المميز - فساتين الزفاف القبائلية',
      coverImage: '/images/products/p2.jpg',
      type: 'lookbook',
      visible: true,
      order: 1,
    },
    {
      slug: 'inspiration-broderie',
      title: 'Inspiration Broderie',
      titleAr: 'إلهام التطريز',
      description:
        'L\'art de la broderie kabyle : motifs traditionnels et techniques ancestrales',
      descriptionAr: 'فن التطريز القبائلي: أنماط تقليدية وتقنيات أجدادنا',
      coverImage: '/images/fabrics/mlifa.jpg',
      type: 'inspiration',
      visible: true,
      order: 2,
    },
  ];

  for (const gallery of galleries) {
    const created = await prisma.gallery.upsert({
      where: { slug: gallery.slug },
      update: {},
      create: gallery,
    });
    console.log(`✅ Created gallery: ${created.slug}`);
  }

  // Add sample images to first gallery
  const firstGallery = await prisma.gallery.findUnique({
    where: { slug: 'collection-printemps-2026' },
  });

  if (firstGallery) {
    const images = [
      {
        url: '/images/products/p1.jpg',
        alt: 'Robe kabyle printemps 1',
        caption: 'Robe en soie avec broderie florale',
        captionAr: 'فستان من الحرير مع تطريز زهري',
        order: 0,
      },
      {
        url: '/images/products/p2.jpg',
        alt: 'Robe kabyle printemps 2',
        caption: 'Karakou traditionnel modernisé',
        captionAr: 'قراقو تقليدي محدث',
        order: 1,
      },
      {
        url: '/images/products/p3.jpg',
        alt: 'Robe kabyle printemps 3',
        caption: 'Gandoura légère pour l\'été',
        captionAr: 'قندورة خفيفة للصيف',
        order: 2,
      },
      {
        url: '/images/products/p4.jpg',
        alt: 'Robe kabyle printemps 4',
        caption: 'Détails de broderie artisanale',
        captionAr: 'تفاصيل التطريز اليدوي',
        order: 3,
      },
    ];

    for (const image of images) {
      await prisma.galleryImage.upsert({
        where: {
          id: `${firstGallery.id}-${image.order}`,
        },
        update: {},
        create: {
          ...image,
          galleryId: firstGallery.id,
        },
      });
    }

    console.log(`✅ Added ${images.length} images to ${firstGallery.slug}`);
  }

  console.log('🎨 Gallery seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding gallery:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
