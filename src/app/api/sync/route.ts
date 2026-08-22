import { NextRequest, NextResponse } from 'next/server';

// In-memory channel store for active session states
declare global {
  var sessionStore: Record<string, any> | undefined;
}

if (!global.sessionStore) {
  global.sessionStore = {};
}

export async function POST(req: NextRequest) {
  try {
    const { pin, state } = await req.json();
    if (!pin) {
      return NextResponse.json({ error: 'Missing PIN' }, { status: 400 });
    }
    
    global.sessionStore![pin] = {
      ...global.sessionStore![pin],
      ...state,
      updatedAt: Date.now(),
    };

    return NextResponse.json({ success: true, state: global.sessionStore![pin] });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get('pin');
  if (!pin) {
    return NextResponse.json({ error: 'Missing PIN' }, { status: 400 });
  }

  const state = global.sessionStore?.[pin] || null;
  return NextResponse.json({ state });
}
