import Script from 'next/script';

type OrganizationData = {
  name: string;
  url: string;
  logo: string;
  description: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint: {
    telephone: string;
    contactType: string;
    areaServed: string;
    availableLanguage: string[];
  };
  sameAs: string[];
};

type ProductData = {
  name: string;
  image: string[];
  description: string;
  brand: string;
  offers: {
    price: number;
    priceCurrency: string;
    availability: string;
  };
};

type BreadcrumbItem = {
  name: string;
  url: string;
};

export function OrganizationStructuredData() {
  const data: OrganizationData = {
    name: 'Taqendurt',
    url: 'https://myrobe-giize.com',
    logo: 'https://myrobe-giize.com/images/og-cover.jpg',
    description: 'Robes kabyles traditionnelles et modernes sur-mesure. Broderie artisanale, livraison dans les 58 wilayas d\'Algérie.',
    address: {
      streetAddress: '',
      addressLocality: 'Alger',
      addressRegion: 'Alger',
      postalCode: '16000',
      addressCountry: 'DZ',
    },
    contactPoint: {
      telephone: '+213-XXX-XXX-XXX',
      contactType: 'Service Client',
      areaServed: 'DZ',
      availableLanguage: ['fr', 'ar', 'kab'],
    },
    sameAs: [
      'https://facebook.com/taqendurt',
      'https://instagram.com/taqendurt',
    ],
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          ...data,
        }),
      }}
    />
  );
}

export function ProductStructuredData({ product }: { product: ProductData }) {
  return (
    <Script
      id="product-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          ...product,
        }),
      }}
    />
  );
}

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        }),
      }}
    />
  );
}
