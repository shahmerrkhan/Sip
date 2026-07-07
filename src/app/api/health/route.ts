import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[GET /api/health]', err);
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}