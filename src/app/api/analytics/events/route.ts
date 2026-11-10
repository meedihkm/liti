import { NextRequest, NextResponse } from 'next/server';

// POST /api/analytics/events - Log custom events
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    // Log to console in dev
    if (process.env.NODE_ENV === 'development') {
      console.log('📈 Event:', event);
    }

    // TODO: Send to analytics service
    // Example: await sendToAnalytics(event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/analytics/events] Error:', error);
    return NextResponse.json({ error: 'Error logging event' }, { status: 500 });
  }
}
