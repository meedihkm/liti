/**
 * Kabyle language utilities
 * Language code: kab (ISO 639-3)
 */

export const KABYLE_LOCALE = 'kab' as const;

export interface TranslatedContent {
  fr?: string | null;
  ar?: string | null;
  kab?: string | null;
}

/**
 * Get content in Kabyle with fallback to French then Arabic
 */
export function getKabyleContent(content: TranslatedContent): string {
  return content.kab || content.fr || content.ar || '';
}

/**
 * Get content by language preference
 */
export function getLocalizedContent(
  content: TranslatedContent,
  locale: 'fr' | 'ar' | 'kab'
): string {
  const value = content[locale];
  if (value) return value;
  
  // Fallback order
  if (locale === 'kab') {
    return content.fr || content.ar || '';
  }
  if (locale === 'ar') {
    return content.fr || content.kab || '';
  }
  return content.ar || content.kab || '';
}

/**
 * Check if Kabyle content exists
 */
export function hasKabyleContent(content: TranslatedContent): boolean {
  return !!content.kab;
}

/**
 * Format date in Kabyle locale
 */
export function formatKabyleDate(date: Date): string {
  // Note: Kabyle doesn't have full Intl support, fallback to French formatting
  return new Intl.DateTimeFormat('fr-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Common Kabyle UI translations
 */
export const kabyleUI = {
  // Navigation
  home: 'Asebter agejdan',
  products: 'Ifarisen',
  gallery: 'Tugna',
  contact: 'Nermes-aɣ',
  about: 'Ɣef-nneɣ',
  
  // Actions
  view: 'Wali',
  edit: 'Ẓreg',
  delete: 'Kkes',
  save: 'Sekles',
  cancel: 'Sefsex',
  add: 'Rnu',
  create: 'Rnu',
  update: 'Leqqem',
  
  // Product
  price: 'Ssuma',
  addToCart: 'Rnu ɣer tqecwalt',
  outOfStock: 'Ulac deg lqayen',
  available: 'Yella',
  
  // Order
  order: 'Tiwṣa',
  orders: 'Tiwṣiwin',
  orderNumber: 'Uṭṭun n tewṣa',
  status: 'Addad',
  tracking: 'Aḍfar',
  
  // Status
  pending: 'Yettṛaǧu',
  processing: 'Iteddu',
  completed: 'Yemmed',
  cancelled: 'Yettusefsex',
  
  // Common
  loading: 'Asali...',
  error: 'Tuccḍa',
  success: 'Yedda!',
  name: 'Isem',
  email: 'Imayl',
  phone: 'Tiliɣri',
  message: 'Izen',
  send: 'Azen',
  
  // Dates
  today: 'Ass-a',
  yesterday: 'Iḍelli',
  tomorrow: 'Azekka'
};
