import { NextResponse } from 'next/server';
import { krevAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Viser hvilke nøkler som er lagt inn i Vercel (uten å vise selve nøklene). */
export async function GET(request: Request) {
  const a = await krevAdmin(request);
  if (a.feil) return a.feil;
  const har = (k: string) => !!process.env[k]?.trim();
  return NextResponse.json({
    supabase: har('SUPABASE_SERVICE_ROLE_KEY'),
    stripe: har('STRIPE_SECRET_KEY'),
    stripeWebhook: har('STRIPE_WEBHOOK_SECRET'),
    stripeTest: (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test'),
    resend: har('RESEND_API_KEY'),
    avsender: process.env.EPOST_AVSENDER || '',
    openai: har('OPENAI_API_KEY'),
    vercel: har('VERCEL_TOKEN'),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
  });
}
