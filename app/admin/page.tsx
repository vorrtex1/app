import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AdminApprovals from '@/components/admin-approvals'

function isAdmin(email?: string | null) {
  return Boolean(email && process.env.ADMIN_EMAILS?.split(',').map((item) => item.trim()).includes(email))
}

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  if (!isAdmin(session.user.email)) redirect('/')
  return <AdminApprovals adminName={session.user.name || session.user.email || 'Admin'} />
}
