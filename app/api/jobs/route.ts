import { generateText, gateway } from 'ai'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { jobs } from '@/lib/db/schema'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const description = String(body.description ?? '').trim()
  if (description.length < 20) return NextResponse.json({ error: 'Please provide at least 20 characters describing the job.' }, { status: 400 })
  if (!body.problemImage) return NextResponse.json({ error: 'A picture of the problem is required.' }, { status: 400 })
  if (typeof body.hasFixtures !== 'boolean') return NextResponse.json({ error: 'Please indicate whether fixtures are needed.' }, { status: 400 })
  if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') return NextResponse.json({ error: 'Your current location is required to book a job.' }, { status: 400 })
  let category = 'medium'
  try {
    const result = await generateText({ model: gateway('openai/o4-mini'), prompt: `Classify this tradesperson job as exactly easy, medium, or hard. Major installation, structural, or dangerous work is hard. Small repairs are easy. Return only one word. Job: ${description}` })
    const value = result.text.trim().toLowerCase()
    if (['easy', 'medium', 'hard'].includes(value)) category = value
  } catch (error) {
    console.error('[v0] job classification failed', error)
  }
  const job = { id: randomUUID(), customerId: session.user.id, description, category, status: 'requested', problemImage: String(body.problemImage), hasFixtures: body.hasFixtures, latitude: body.latitude, longitude: body.longitude, fixtureNote: body.hasFixtures ? 'Price subject to change based on the price of fixtures.' : null }
  await db.insert(jobs).values(job)
  return NextResponse.json(job, { status: 201 })
}
