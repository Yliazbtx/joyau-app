'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      router.push('/')
      router.refresh()
    } catch (e) {
      setError('Erreur de connexion')
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#1a2340',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#f4f3f0',borderRadius:'16px',padding:'48px',width:'100%',maxWidth:'400px'}}>
        <h1 style={{textAlign:'center',fontFamily:'Georgia,serif',fontSize:'36px',color:'#1a2340',marginBottom:'4px'}}>Joyau</h1>
        <p style={{textAlign:'center',color:'#b8975a',letterSpacing:'4px',fontSize:'11px',marginBottom:'8px'}}>IMMOBILIER</p>
        <p style={{textAlign:'center',color:'#888',marginBottom:'32px'}}>Suivi des estimations</p>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required
            style={{width:'100%',padding:'12px',borderRadius:'8px',border:'1px solid #ddd',marginBottom:'12px',fontSize:'15px',boxSizing:'border-box'}}/>
          <input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} required
            style={{width:'100%',padding:'12px',borderRadius:'8px',border:'1px solid #ddd',marginBottom:'12px',fontSize:'15px',boxSizing:'border-box'}}/>
          {error && <p style={{color:'red',marginBottom:'12px',fontSize:'14px'}}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'14px',background:'#1a2340',color:'white',border:'none',borderRadius:'8px',fontSize:'16px',cursor:'pointer'}}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
