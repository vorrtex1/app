'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [accountType, setAccountType] = useState<'customer' | 'worker'>('customer')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nativeEvent = event.nativeEvent as KeyboardEvent
    if (nativeEvent.isComposing || nativeEvent.keyCode === 229) return
    setPending(true); setError(''); setUploadError('')
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email')); const password = String(data.get('password')); const name = String(data.get('name') || '')
    const result = mode === 'sign-in'
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ email, password, name })
    if (result.error) { setError('We could not complete that request. Check your details and try again.'); setPending(false); return }
    if (mode === 'sign-up' && accountType === 'worker') {
      const idFile = data.get('idFile')
      let idPathname = ''
      if (idFile instanceof File && idFile.size > 0) {
        const uploadData = new FormData(); uploadData.append('file', idFile)
        const upload = await fetch('/api/worker/id-upload', { method: 'POST', body: uploadData })
        if (!upload.ok) { setUploadError('Your account was created, but the ID upload failed. Sign in and retry verification.'); setPending(false); return }
        idPathname = (await upload.json()).pathname
      }
      await fetch('/api/worker/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trade: data.get('trade'), phone: data.get('phone'), idNumber: data.get('idNumber'), certificate: data.get('certificate'), idPathname }) })
    }
    router.push('/'); router.refresh()
  }

  return <form className="auth-form" onSubmit={submit}>
    {mode === 'sign-up' && <><label>Full name<input name="name" required placeholder="Your name" /></label><div className="account-switch"><button type="button" className={accountType === 'customer' ? 'selected' : ''} onClick={() => setAccountType('customer')}>Customer account</button><button type="button" className={accountType === 'worker' ? 'selected' : ''} onClick={() => setAccountType('worker')}>Worker account</button></div>{accountType === 'worker' && <div className="worker-fields"><label>Trade<select name="trade"><option>Plumber</option><option>Electrician</option><option>Carpenter</option><option>Painter</option><option>Mason</option></select></label><label>Phone number<input name="phone" required placeholder="+1 868 ..." /></label><label>ID number<input name="idNumber" required placeholder="Government ID number" /></label><label>Certificate or license<input name="certificate" required placeholder="Certificate number or link" /></label><label>Government ID picture<input name="idFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required /><small>JPG, PNG, WEBP, or PDF up to 8MB.</small></label><p className="form-note">Worker accounts are reviewed before they can accept jobs. Your ID and certificates are securely submitted for validation.</p></div>}</>}
    <label>Email<input name="email" type="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" minLength={8} required placeholder="At least 8 characters" /></label>{(error || uploadError) && <p className="form-error">{error || uploadError}</p>}<button className="primary" disabled={pending}>{pending ? 'Please wait...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button>
  </form>
}
