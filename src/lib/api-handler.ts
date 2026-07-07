import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export function handleApiError(err: unknown, context: string) {
  console.error(`[${context}]`, err);
  Sentry.captureException(err, { tags: { route: context } });
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}