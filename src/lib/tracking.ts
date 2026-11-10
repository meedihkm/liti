import { customAlphabet } from 'nanoid';

/**
 * Generate a unique tracking token
 * Format: 8 characters, alphanumeric uppercase
 * Example: A3X9K2M7
 */
export function generateTrackingToken(): string {
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
  return nanoid();
}

/**
 * Generate tracking URL for a given token
 */
export function getTrackingUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/commande/${token}`;
}
