import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { feedback } from '@/lib/db/schema'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const rating = Number(body.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !body.jobId || !body.toUserId) return NextResponse.json({ error: 'A valid rating and completed job are required.' }, { status: 400 })
  const entry = { id: randomUUID(), jobId: String(body.jobId), fromUserId: session.user.id, toUserId: String(body.toUserId), rating, comment: String(body.comment ?? '').trim() || null }
  await db.insert(feedback).values(entry)
  return NextResponse.json(entry, { status: 201 })
}
