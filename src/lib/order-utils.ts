import { prisma } from './db';
import { generateTrackingToken, getTrackingUrl } from './tracking';

/**
 * Create or get tracking token for an order
 */
export async function ensureTrackingToken(orderId: string): Promise<string> {
  // Check if tracking token already exists
  const existing = await db.trackingToken.findUnique({
    where: { orderId },
  });

  if (existing) {
    return existing.token;
  }

  // Generate new token
  let token = generateTrackingToken();
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure uniqueness
  while (attempts < maxAttempts) {
    const exists = await db.trackingToken.findUnique({
      where: { token },
    });

    if (!exists) {
      break;
    }

    token = generateTrackingToken();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate unique tracking token');
  }

  // Create tracking token
  const trackingToken = await db.trackingToken.create({
    data: {
      orderId,
      token,
    },
  });

  return trackingToken.token;
}

export { getTrackingUrl };
