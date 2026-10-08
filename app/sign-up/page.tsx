import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AuthForm from '@/components/auth-form'

export default async function SignUp() { if (await auth.api.getSession({ headers: await headers() })) redirect('/'); return <main className="auth-page"><div className="auth-card"><div className="logo">Trade<span>Run</span></div><h1>Create your account</h1><p>Choose the account that fits how you use TradeRun.</p><AuthForm mode="sign-up" /><Link href="/sign-in">Already have an account? Sign in</Link></div></main> }
