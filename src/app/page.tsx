'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function HomePage() {
  const [estimations, setEstimations] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: e } = await supabase.from('estimations').select('*').order('created_at', { ascending: false })
      setEstimations(e || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const statusColor = (s: string) => s === 'gagne' ? '#16a34a' : s === 'perdu' ? '#dc2626' : s === 'en_cours' ? '#d97706' : '#6b7280'
  const statusLabel = (s: string) => s === 'gagne' ? 'Gagné' : s === 'perdu' ? 'Perdu' : s === 'en_cours' ? 'En cours' : 'En attente'
  const fmt = (v: number) => new Intl.NumberFormat('fr-FR', {style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v)

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Chargement...</p></div>

  return (
    <div style={{minHeight:'100vh',background:'#f4f3f0'}}>
      <header style={{background:'#1a2340',padding:'0 32px',height:'60px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:'Georgia,serif',color:'#fff',fontSize:'18px',letterSpacing:'1px'}}>Joyau <span style={{color:'#b8975a',fontSize:'11px',letterSpacing:'2px'}}>IMMOBILIER</span></span>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <span style={{color:'#b8975a',fontSize:'13px'}}>{profile?.full_name} · {profile?.role === 'manager' ? 'Manager' : 'Commercial'}</span>
          <button onClick={handleLogout} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'6px 14px',borderRadius:'6px',fontSize:'13px',cursor:'pointer'}}>Déconnexion</button>
        </div>
      </header>
      <main style={{padding:'32px',maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'22px',color:'#1a2340'}}>{profile?.role === 'manager' ? 'Toutes les estimations' : 'Mes estimations'}</h2>
          <a href="/nouvelle-estimation" style={{background:'#1a2340',color:'#fff',padding:'10px 20px',borderRadius:'8px',textDecoration:'none',fontSize:'13px'}}>+ Nouvelle estimation</a>
        </div>
        {estimations.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px',color:'#6b7280'}}><p>Aucune estimation pour le moment</p></div>
        ) : (
          <div style={{background:'#fff',borderRadius:'12px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f4f3f0'}}>
                  {['Client','Adresse','Estimation',profile?.role==='manager'?'Commercial':null,'Statut','Date'].filter(Boolean).map(h=>(
                    <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',letterSpacing:'1px',textTransform:'uppercase',color:'#6b7280',fontWeight:'500'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estimations.map((est,i)=>(
                  <tr key={est.id} style={{borderTop:'1px solid #f4f3f0',background:i%2===0?'#fff':'#fafaf8'}}>
                    <td style={{padding:'14px 16px',fontWeight:'500'}}>{est.client_name}</td>
                    <td style={{padding:'14px 16px',color:'#6b7280',fontSize:'13px'}}>{est.address}</td>
                    <td style={{padding:'14px 16px',fontWeight:'600'}}>{fmt(est.estimated_value)}</td>
                    {profile?.role==='manager' && <td style={{padding:'14px 16px',color:'#6b7280',fontSize:'13px'}}>{est.commercial_name}</td>}
                    <td style={{padding:'14px 16px'}}>
                      <span style={{background:statusColor(est.status)+'20',color:statusColor(est.status),padding:'3px 10px',borderRadius:'20px',fontSize:'12px'}}>{statusLabel(est.status)}</span>
                    </td>
                    <td style={{padding:'14px 16px',color:'#6b7280',fontSize:'13px'}}>{new Date(est.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
