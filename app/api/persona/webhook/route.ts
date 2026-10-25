import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { customerProfile, workerProfile } from '@/lib/db/schema'
export async function POST(request: Request) {
  const signature = request.headers.get('persona-signature')
  if (!process.env.PERSONA_WEBHOOK_SECRET || signature !== process.env.PERSONA_WEBHOOK_SECRET) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  const event = await request.json(); const data = event.data?.attributes ?? {}; const inquiryId = event.data?.id
  const status = data.status === 'completed' || data.status === 'approved' ? 'verified' : data.status === 'failed' ? 'failed' : String(data.status ?? 'pending')
  await db.update(workerProfile).set({ personaStatus: status }).where(eq(workerProfile.personaInquiryId, inquiryId))
  await db.update(customerProfile).set({ personaStatus: status }).where(eq(customerProfile.personaInquiryId, inquiryId))
  return NextResponse.json({ received: true })
}
