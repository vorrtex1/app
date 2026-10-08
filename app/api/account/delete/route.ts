import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { accountConsent, feedback, jobLocation, jobs, workerProfile } from '@/lib/db/schema'
import { headers } from 'next/headers'

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  await db.delete(jobLocation).where(eq(jobLocation.userId, userId))
  await db.delete(feedback).where(eq(feedback.fromUserId, userId))
  await db.delete(feedback).where(eq(feedback.toUserId, userId))
  await db.delete(jobs).where(eq(jobs.customerId, userId))
  await db.delete(workerProfile).where(eq(workerProfile.userId, userId))
  await db.delete(accountConsent).where(eq(accountConsent.userId, userId))
  await auth.api.signOut({ headers: await headers() })
  // Permanently remove the Better Auth user row so this email can never authenticate again.
  await db.execute(sql`DELETE FROM "user" WHERE "id" = ${userId}`)
  return NextResponse.json({ ok: true, message: 'Your TradeRun app data has been deleted and your session has ended.' })
}
