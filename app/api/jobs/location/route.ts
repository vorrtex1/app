'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { jobLocation, jobs } from '@/lib/db/schema'
import { headers } from 'next/headers'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const jobId = typeof body?.jobId === 'string' ? body.jobId : ''
  const latitude = Number(body?.latitude)
  const longitude = Number(body?.longitude)
  if (!jobId || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: 'Valid job and coordinates are required' }, { status: 400 })
  }
  const [job] = await db.select({ customerId: jobs.customerId, workerId: jobs.workerId, status: jobs.status }).from(jobs).where(eq(jobs.id, jobId)).limit(1)
  if (!job || (job.customerId !== user.id && job.workerId !== user.id) || !['accepted', 'in_progress'].includes(job.status)) {
    return NextResponse.json({ error: 'Location sharing is unavailable for this job' }, { status: 403 })
  }
  const id = `${jobId}:${user.id}`
  await db.insert(jobLocation).values({ id, jobId, userId: user.id, latitude, longitude, updatedAt: new Date() }).onConflictDoUpdate({ target: jobLocation.id, set: { latitude, longitude, updatedAt: new Date() } })
  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const jobId = request.nextUrl.searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'Job is required' }, { status: 400 })
  const [job] = await db.select({ customerId: jobs.customerId, workerId: jobs.workerId, status: jobs.status }).from(jobs).where(eq(jobs.id, jobId)).limit(1)
  if (!job || (job.customerId !== user.id && job.workerId !== user.id) || !['accepted', 'in_progress'].includes(job.status)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const locations = await db.select({ userId: jobLocation.userId, latitude: jobLocation.latitude, longitude: jobLocation.longitude, updatedAt: jobLocation.updatedAt }).from(jobLocation).where(and(eq(jobLocation.jobId, jobId), eq(jobLocation.userId, job.customerId))).orderBy(desc(jobLocation.updatedAt)).limit(1)
  const workerLocations = await db.select({ userId: jobLocation.userId, latitude: jobLocation.latitude, longitude: jobLocation.longitude, updatedAt: jobLocation.updatedAt }).from(jobLocation).where(and(eq(jobLocation.jobId, jobId), eq(jobLocation.userId, job.workerId ?? ''))).orderBy(desc(jobLocation.updatedAt)).limit(1)
  return NextResponse.json({ locations: [...locations, ...workerLocations] })
}
