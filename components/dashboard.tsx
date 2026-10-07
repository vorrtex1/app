'use client'

import { useState } from 'react'
import { Bell, BriefcaseBusiness, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, LayoutDashboard, MapPin, Settings, ShieldCheck, Star, TrendingUp, Users, Wrench } from 'lucide-react'

const jobs = [
  { initials: 'MP', name: 'Marcus Phillip', trade: 'Plumbing · 1.2 km away', status: 'On the way', amount: '$90.00', color: 'green' },
  { initials: 'AR', name: 'Anil Ramdass', trade: 'Plumbing · 3.4 km away', status: 'Accepted', amount: '$70.00', color: '' },
  { initials: 'KL', name: 'Kerron Baptiste', trade: 'Electrical · 2.1 km away', status: 'Completed', amount: '$165.00', color: 'green' },
]
const trades = ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mason']

export default function Page({ role: accountRole = 'customer' }: { role?: 'customer' | 'worker' }) {
  const [role] = useState<'customer' | 'worker'>(accountRole)
  const [activeNav, setActiveNav] = useState('Overview')
  const [online, setOnline] = useState(true)
  const [trade, setTrade] = useState('Plumber')

  const worker = role === 'worker'
  const nav = worker ? ['Overview', 'Jobs', 'Earnings', 'Profile'] : ['Overview', 'Book a worker', 'Your bookings', 'Messages']

  return <div className="shell">
    <aside className="sidebar">
      <div className="logo">Trade<span>Run</span></div>
      <nav className="nav" aria-label="Primary navigation">
        {nav.map((item, i) => <button key={item} className={activeNav === item ? 'active' : ''} onClick={() => setActiveNav(item)}>
          {i === 0 ? <LayoutDashboard /> : i === 1 ? <BriefcaseBusiness /> : i === 2 ? <CircleDollarSign /> : <Users />}<span>{item}</span>
        </button>)}
      </nav>
      <div className="role"><small>Signed in as</small><strong>{worker ? 'Verified worker' : 'Customer'}</strong><span>{worker ? 'Worker workspace' : 'Customer workspace'}</span></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="crumb">Workspace / {activeNav}</div><h1>{worker ? 'Worker dashboard' : 'Customer dashboard'}</h1></div><div className="top-actions"><button className="iconbtn" aria-label="Notifications"><Bell /></button><button className="iconbtn" aria-label="Settings"><Settings /></button><div className="avatar">{worker ? 'MP' : 'AR'}</div></div></header>
      <div className="content">
        <div className="hero"><div><div className="eyebrow">{worker ? 'Tuesday, October 7' : 'Good morning, Alicia'}</div><h2>{worker ? 'Keep the work moving.' : 'What needs fixing?'}</h2><p>{worker ? 'Track your active jobs, earnings, and availability.' : 'Find a trusted professional nearby in a few simple steps.'}</p></div>{!worker && <button className="accent">Book a worker <ChevronRight size={15} /></button>}</div>
        {worker ? <WorkerView online={online} setOnline={setOnline} /> : <CustomerView trade={trade} setTrade={setTrade} />}
      </div>
    </main>
  </div>
}

function WorkerView({ online, setOnline }: { online: boolean; setOnline: (v: boolean) => void }) { return <div className="grid">
  <div className="stats card"><div className="stat"><label>Today&apos;s earnings</label><strong>$248.50</strong><span className="trend">+18.4% this week</span></div><div className="stat"><label>Jobs completed</label><strong>12</strong><span className="trend">+3 from last week</span></div><div className="stat"><label>Average rating</label><strong>4.9 <Star size={20} fill="currentColor" color="#f5c400" /></strong><span className="trend">Top rated nearby</span></div><div className="stat"><label>Response time</label><strong>4 min</strong><span className="trend">Faster than 82%</span></div></div>
  <section className="mapcard card"><div className="cardhead"><span className="cardtitle">Live jobs map</span><span className="link">Open full map <ChevronRight size={13} /></span></div><div className="map"><span className="route" /><i className="pin p1" /><i className="pin p2" /><i className="pin p3" /></div></section>
  <section className="sidecard card"><div className="cardhead"><span className="cardtitle">Availability</span><button className="toggle" onClick={() => setOnline(!online)}><span className={online ? 'on' : ''}>{online ? 'Online' : 'Offline'}</span></button></div><div style={{display:'flex',gap:12,alignItems:'center',margin:'22px 0'}}><div className="avatar" style={{width:48,height:48}}>MP</div><div><strong>Marcus Phillip</strong><p style={{margin:'3px 0',color:'var(--muted)',fontSize:12}}>Plumbing specialist</p></div><CheckCircle2 size={18} color="var(--green)" /></div><div style={{background:'var(--concrete)',padding:14,borderRadius:9,fontSize:13}}><strong>{online ? 'You are visible to customers' : 'You are currently offline'}</strong><p style={{margin:'6px 0 0',color:'var(--muted)'}}>{online ? 'New requests will appear here as they come in.' : 'Go online when you are ready to receive jobs.'}</p></div></section>
  <section className="section card"><div className="cardhead"><span className="cardtitle">Active jobs</span><span className="link">View all</span></div>{jobs.map(j => <div className="job" key={j.name}><div className="mini">{j.initials}</div><div><strong>{j.name}</strong><p>{j.trade}</p></div><span className={`status ${j.color}`}>{j.status}</span><strong>{j.amount}</strong></div>)}</section>
  <section className="section small card"><div className="cardhead"><span className="cardtitle">This week</span><TrendingUp size={18} color="var(--green)" /></div><div style={{height:100,display:'flex',alignItems:'end',gap:9,padding:'12px 4px 0',borderBottom:'1px solid var(--line)'}}>{[38,62,48,78,66,92,74].map((h,i)=><div key={i} style={{height:`${h}%`,flex:1,background:i===5?'var(--yellow)':'#d7e0e0',borderRadius:'5px 5px 0 0'}} />)}</div><div style={{display:'flex',justifyContent:'space-between',color:'var(--muted)',fontSize:11,marginTop:9}}><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></section>
</div> }

function CustomerView({ trade, setTrade }: { trade: string; setTrade: (v: string) => void }) { return <div className="grid">
  <section className="section card"><div className="eyebrow">Start a new booking</div><h3 style={{fontFamily:'Space Grotesk',fontSize:24,margin:'8px 0 20px'}}>Tell us what you need help with</h3><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:22}}>{trades.map(t => <button key={t} className={trade===t?'accent':'iconbtn'} style={{width:'auto',padding:'10px 14px'}} onClick={() => setTrade(t)}><Wrench size={15} /> {t}</button>)}</div><label className="eyebrow">Job address</label><div style={{display:'flex',gap:10,alignItems:'center',border:'1px solid var(--line)',borderRadius:9,padding:'13px 14px',marginTop:8}}><MapPin size={18} color="var(--muted)" /><span style={{color:'var(--muted)',fontSize:14}}>12 Mango Lane, Port of Spain</span></div><label className="eyebrow" style={{display:'block',marginTop:20}}>Describe the job <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label><textarea placeholder="e.g. Kitchen sink is leaking under the cabinet" style={{width:'100%',height:85,marginTop:8,border:'1px solid var(--line)',borderRadius:9,padding:12,resize:'vertical'}} /><button className="primary" style={{marginTop:16,width:'100%'}}>Find verified workers <ChevronRight size={15} /></button></section>
  <section className="sidecard card"><div className="cardhead"><span className="cardtitle">Leave feedback</span><Star size={18} color="var(--yellow)" /></div><p style={{color:'var(--muted)',fontSize:13}}>Rate your most recent completed booking.</p><div style={{display:'flex',gap:6}}>{[1,2,3,4,5].map(n=><button key={n} className="iconbtn" aria-label={`${n} stars`} onClick={() => fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobId:'recent-booking',toUserId:'worker'})})}><Star size={16} /></button>)}</div></section><section className="sidecard card"><div className="cardhead"><span className="cardtitle">Your next booking</span><Clock3 size={18} color="var(--muted)" /></div><div style={{padding:'18px 0'}}><div className="status green" style={{display:'inline-block'}}>On the way</div><h3 style={{fontFamily:'Space Grotesk',fontSize:22,margin:'12px 0 4px'}}>Marcus Phillip</h3><p style={{margin:0,color:'var(--muted)',fontSize:13}}>Plumbing · Arriving in ~5 min</p></div><div className="map" style={{height:135}}><i className="pin p2" /></div><button className="iconbtn" style={{width:'100%',marginTop:14}}>Track booking <ChevronRight size={15} /></button></section>
  <section className="section card"><div className="cardhead"><span className="cardtitle">Recent bookings</span><span className="link">View all</span></div><table className="table"><thead><tr><th>Worker</th><th>Service</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>{jobs.map((j,i)=><tr key={j.name}><td><strong>{j.name}</strong></td><td>{j.trade.split(' · ')[0]}</td><td>Oct {7-i}</td><td>{j.amount}</td><td><span className={`status ${j.color}`}>{j.status}</span></td></tr>)}</tbody></table></section>
  <section className="section small card"><div className="cardhead"><span className="cardtitle">Why TradeRun?</span><ShieldCheck size={18} color="var(--green)" /></div>{[['Verified professionals','Every worker is identity checked.'],['Clear hourly rates','Know what you pay before work starts.'],['Live job tracking','See when help is on the way.']].map(([a,b])=><div className="job" key={a}><CheckCircle2 size={18} color="var(--green)" /><div><strong>{a}</strong><p>{b}</p></div></div>)}</section>
</div> }
