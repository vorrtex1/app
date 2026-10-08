import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { workerProfile } from '@/lib/db/schema'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  if (!body.trade || !body.phone || !body.idNumber || !body.certificate) return NextResponse.json({ error: 'Missing verification details' }, { status: 400 })
  await db.insert(workerProfile).values({ id: crypto.randomUUID(), userId: session.user.id, trade: body.trade, phone: body.phone, bio: `ID submitted: ${body.idNumber}`, idDocument: body.idPathname || null, certificates: body.certificate })
  return NextResponse.json({ status: 'pending' }, { status: 201 })
}
