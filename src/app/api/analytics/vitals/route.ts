import { NextRequest, NextResponse } from 'next/server';

// POST /api/analytics/vitals - Log Web Vitals
export async function POST(req: NextRequest) {
  try {
    const metric = await req.json();

    // Log to console in dev, send to monitoring service in production
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vital:', metric);
    }

    // TODO: Send to monitoring service (Vercel Analytics, Google Analytics, etc.)
    // Example: await sendToAnalytics(metric);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/analytics/vitals] Error:', error);
    return NextResponse.json({ error: 'Error logging metric' }, { status: 500 });
  }
}
