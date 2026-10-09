'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#1a2340',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#f4f3f0',borderRadius:'12px',padding:'48px 40px',width:'100%',maxWidth:'400px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'28px',color:'#1a2340',letterSpacing:'2px'}}>Joyau</h1>
          <p style={{color:'#b8975a',fontSize:'11px',letterSpacing:'3px',textTransform:'uppercase',marginTop:'4px'}}>Immobilier</p>
          <p style={{color:'#6b7280',fontSize:'13px',marginTop:'12px'}}>Suivi des estimations</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%',padding:'12px 16px',border:'1px solid #e5e4e1',borderRadius:'8px',fontSize:'14px',marginBottom:'12px',display:'block'}} />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} required style={{width:'100%',padding:'12px 16px',border:'1px solid #e5e4e1',borderRadius:'8px',fontSize:'14px',marginBottom:'8px',display:'block'}} />
          {error && <p style={{color:'#dc2626',fontSize:'13px',marginBottom:'8px'}}>{error}</p>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:'13px',background:'#1a2340',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',cursor:'pointer',marginTop:'8px'}}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
