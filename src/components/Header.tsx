'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface HeaderProps {
  userName?: string
  userRole?: string
  showTeam?: boolean
  backLink?: string
}

export default function Header({ userName, userRole, showTeam, backLink }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header style={{background:'#1a2340',padding:'0 40px',height:'72px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 20px rgba(0,0,0,0.3)'}}>
      <a href="/" style={{textDecoration:'none',display:'flex',flexDirection:'column',alignItems:'center',lineHeight:1}}>
        <span style={{fontFamily:'"Cormorant Garant",serif',color:'#fff',fontSize:'28px',fontWeight:600,letterSpacing:'6px',textTransform:'uppercase'}}>Joyau</span>
        <span style={{color:'#b8975a',fontSize:'9px',letterSpacing:'5px',textTransform:'uppercase',fontFamily:'"Jost",sans-serif',fontWeight:400,marginTop:'2px'}}>— Immobilier —</span>
      </a>
      <nav style={{display:'flex',gap:'8px',alignItems:'center'}}>
        {backLink && <a href={backLink} style={{color:'rgba(255,255,255,0.6)',fontSize:'13px',textDecoration:'none',fontFamily:'"Jost",sans-serif',padding:'6px 12px'}}>← Retour</a>}
        {showTeam && <a href="/utilisateurs" style={{color:'rgba(255,255,255,0.7)',fontSize:'13px',textDecoration:'none',fontFamily:'"Jost",sans-serif',padding:'6px 14px',borderRadius:'6px'}} onMouseOver={e=>(e.currentTarget.style.color='#fff')} onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.7)')}>Équipe</a>}
        {userName && <span style={{color:'rgba(255,255,255,0.45)',fontSize:'13px',fontFamily:'"Jost",sans-serif',padding:'0 8px'}}>{userName}</span>}
        {!backLink && <button onClick={handleLogout} style={{background:'transparent',border:'1px solid rgba(184,151,90,0.5)',color:'#b8975a',padding:'7px 16px',borderRadius:'6px',fontSize:'12px',cursor:'pointer',fontFamily:'"Jost",sans-serif',letterSpacing:'1px',textTransform:'uppercase'}}>Déconnexion</button>}
      </nav>
    </header>
  )
}
