/**
 * Analytics utilities for tracking user behavior and performance
 */

// Web Vitals tracking
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: 'web-vital' | 'custom';
}) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics endpoint
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    }).catch(() => {
      // Fail silently
    });
  }
}

// Custom event tracking
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, properties, timestamp: Date.now() }),
    }).catch(() => {
      // Fail silently
    });
  }
}

// Page view tracking
export function trackPageView(url: string) {
  if (process.env.NODE_ENV === 'production') {
    trackEvent('page_view', { url });
  }
}

// E-commerce tracking
export function trackProductView(productId: string, productName: string) {
  trackEvent('product_view', { productId, productName });
}

export function trackAddToCart(productId: string, productName: string, price: number) {
  trackEvent('add_to_cart', { productId, productName, price });
}

export function trackPurchase(orderId: string, total: number, items: number) {
  trackEvent('purchase', { orderId, total, items });
}

export function trackQuoteRequest(quoteId: string) {
  trackEvent('quote_request', { quoteId });
}
