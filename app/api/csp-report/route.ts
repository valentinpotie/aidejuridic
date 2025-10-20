// app/api/csp-report/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Log les violations CSP (en dev uniquement)
    if (process.env.NODE_ENV !== 'production') {
      console.log('CSP Violation:', JSON.stringify(body, null, 2));
    }
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
