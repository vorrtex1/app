import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { customerProfile } from '@/lib/db/schema'
import { createPersonaInquiry } from '@/lib/persona'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  if (!body.idPathname) return NextResponse.json({ error: 'Government ID is required' }, { status: 400 })
  const persona = await createPersonaInquiry({ userId: session.user.id, accountType: 'customer', name: session.user.name, email: session.user.email })
  await db.insert(customerProfile).values({ id: crypto.randomUUID(), userId: session.user.id, idDocument: body.idPathname, personaInquiryId: persona.id, personaStatus: persona.status })
  return NextResponse.json({ status: 'pending', personaStatus: persona.status }, { status: 201 })
}
