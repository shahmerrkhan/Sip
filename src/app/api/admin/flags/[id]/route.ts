import { db } from '@/db';
import { flags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-handler';
import { isAdmin } from '@/lib/admin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const { action } = await req.json(); // 'dismiss' | 'action'
    if (!['dismiss', 'action'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    const updated = await db.update(flags)
      .set({ status: action === 'dismiss' ? 'dismissed' : 'actioned', resolvedAt: new Date() })
      .where(eq(flags.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (err) {
    return handleApiError(err, 'PATCH /api/admin/flags/[id]');
  }
}