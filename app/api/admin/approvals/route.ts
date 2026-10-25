import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { customerProfile, workerProfile } from '@/lib/db/schema'

function isAdmin(session: { user?: { email?: string | null } } | null) { return Boolean(session?.user?.email && process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()).includes(session.user.email)) }
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() }); if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const [workers, customers] = await Promise.all([db.select().from(workerProfile).where(eq(workerProfile.status, 'pending')), db.select().from(customerProfile).where(eq(customerProfile.status, 'pending'))])
  return NextResponse.json({ workers, customers })
}
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() }); if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json(); const status = body.status === 'approved' ? 'approved' : 'rejected'
  if (body.accountType === 'worker') await db.update(workerProfile).set({ status, approvedAt: status === 'approved' ? new Date() : null, reviewedBy: session.user.id }).where(and(eq(workerProfile.id, body.profileId), eq(workerProfile.status, 'pending')))
  else await db.update(customerProfile).set({ status, approvedAt: status === 'approved' ? new Date() : null, reviewedBy: session.user.id }).where(and(eq(customerProfile.id, body.profileId), eq(customerProfile.status, 'pending')))
  return NextResponse.json({ status })
}
