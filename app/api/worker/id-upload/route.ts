import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'ID image is required' }, { status: 400 })
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) return NextResponse.json({ error: 'Upload a JPG, PNG, WEBP, or PDF' }, { status: 400 })
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'ID file must be under 8MB' }, { status: 400 })
  const blob = await put(`worker-verification/${session.user.id}/${crypto.randomUUID()}-${file.name}`, file, { access: 'private' })
  return NextResponse.json({ pathname: blob.pathname })
}
