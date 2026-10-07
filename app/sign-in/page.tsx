import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AuthForm from '@/components/auth-form'

export default async function SignIn() { if (await auth.api.getSession({ headers: await headers() })) redirect('/'); return <main className="auth-page"><div className="auth-card"><div className="logo">Trade<span>Run</span></div><h1>Welcome back</h1><p>Sign in to manage bookings and jobs.</p><AuthForm mode="sign-in" /><Link href="/sign-up">Need an account? Create one</Link></div></main> }
