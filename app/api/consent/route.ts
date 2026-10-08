import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { accountConsent } from '@/lib/db/schema'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  if (body.policyVersion !== '2026-10-07') return NextResponse.json({ error: 'Invalid policy version' }, { status: 400 })
  await db.insert(accountConsent).values({ id: crypto.randomUUID(), userId: session.user.id, policyVersion: body.policyVersion })
  return NextResponse.json({ ok: true })
}
