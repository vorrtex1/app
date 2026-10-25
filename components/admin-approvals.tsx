'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, ShieldCheck, Users, XCircle } from 'lucide-react'

type Profile = {
  id: string
  userId: string
  status: string
  createdAt?: string
  personaStatus?: string | null
  idDocumentUrl?: string | null
}

type ApprovalData = { workers: Profile[]; customers: Profile[] }

export default function AdminApprovals({ adminName }: { adminName: string }) {
  const [data, setData] = useState<ApprovalData>({ workers: [], customers: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const response = await fetch('/api/admin/approvals', { cache: 'no-store' })
    if (!response.ok) setError('Unable to load pending approvals.')
    else setData(await response.json())
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const review = async (accountType: 'worker' | 'customer', profileId: string, status: 'approved' | 'rejected') => {
    setUpdating(profileId)
    setError('')
    const response = await fetch('/api/admin/approvals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountType, profileId, status }),
    })
    if (!response.ok) setError('That approval could not be updated.')
    else setData((current) => ({ ...current, [accountType === 'worker' ? 'workers' : 'customers']: current[accountType === 'worker' ? 'workers' : 'customers'].filter((profile) => profile.id !== profileId) }))
    setUpdating(null)
  }

  const total = data.workers.length + data.customers.length

  return <main className="admin-page">
    <header className="admin-header">
      <div><div className="eyebrow">TradeRun administration</div><h1>Account approvals</h1><p>Review identity checks before customers and workers can book or accept jobs.</p></div>
      <div className="admin-user"><ShieldCheck size={18} /><span>{adminName}</span></div>
    </header>
    <section className="admin-stats">
      <div className="card admin-stat"><Clock3 size={20} /><strong>{total}</strong><span>Pending review</span></div>
      <div className="card admin-stat"><Users size={20} /><strong>{data.customers.length}</strong><span>Customers</span></div>
      <div className="card admin-stat"><ShieldCheck size={20} /><strong>{data.workers.length}</strong><span>Workers</span></div>
    </section>
    {error && <p className="form-error" role="alert">{error}</p>}
    {loading ? <div className="card admin-empty">Loading approvals…</div> : total === 0 ? <div className="card admin-empty"><CheckCircle2 size={32} /><h2>All caught up</h2><p>There are no pending account approvals.</p></div> : <div className="admin-columns"><ApprovalList title="Worker approvals" accountType="worker" profiles={data.workers} updating={updating} onReview={review} /><ApprovalList title="Customer approvals" accountType="customer" profiles={data.customers} updating={updating} onReview={review} /></div>}
  </main>
}

function ApprovalList({ title, accountType, profiles, updating, onReview }: { title: string; accountType: 'worker' | 'customer'; profiles: Profile[]; updating: string | null; onReview: (type: 'worker' | 'customer', id: string, status: 'approved' | 'rejected') => void }) {
  return <section className="admin-list"><div className="admin-list-heading"><h2>{title}</h2><span className="status">{profiles.length} pending</span></div>{profiles.map((profile) => <article className="card approval-card" key={profile.id}><div className="approval-top"><div className="mini">{accountType === 'worker' ? 'W' : 'C'}</div><div><strong>{accountType === 'worker' ? 'Worker account' : 'Customer account'}</strong><p>Submitted {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'recently'}</p></div></div><div className="approval-meta"><span>Persona: <strong>{profile.personaStatus || 'Pending'}</strong></span><span>ID document: <strong>{profile.idDocumentUrl ? 'Uploaded' : 'Not uploaded'}</strong></span></div><div className="approval-actions"><button className="danger" disabled={updating === profile.id} onClick={() => onReview(accountType, profile.id, 'rejected')}><XCircle size={15} /> Reject</button><button className="primary" disabled={updating === profile.id} onClick={() => onReview(accountType, profile.id, 'approved')}><CheckCircle2 size={15} /> Approve</button></div></article>)}</section>
}
