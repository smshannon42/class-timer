import { NextRequest, NextResponse } from 'next/server';

// Global cache shared between phone remote & display
const stateMap = new Map<string, { data: any; timestamp: number }>();

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, state } = body;

    if (!pin) {
      return NextResponse.json({ error: 'Missing PIN' }, { status: 400 });
    }

    const current = stateMap.get(pin)?.data || {};
    stateMap.set(pin, {
      data: { ...current, ...state },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, state: stateMap.get(pin)!.data });
  } catch {
    return NextResponse.json({ error: 'Failed to process update' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get('pin');
  if (!pin) {
    return NextResponse.json({ error: 'Missing PIN' }, { status: 400 });
  }

  const record = stateMap.get(pin);
  return NextResponse.json({
    state: record ? record.data : null,
    timestamp: record ? record.timestamp : 0,
  });
}
