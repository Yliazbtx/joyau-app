'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function NouvelleEstimation() {
  const [form, setForm] = useState({client_name:'',address:'',estimated_value:'',status:'en_attente',notes:''})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: p } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const { error } = await supabase.from('estimations').insert({
      client_name: form.client_name, address: form.address,
      estimated_value: parseFloat(form.estimated_value),
      status: form.status, notes: form.notes,
      user_id: user.id, commercial_name: p?.full_name || user.email
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/')
  }

  const inp = {width:'100%',padding:'11px 14px',border:'1px solid #e5e4e1',borderRadius:'8px',fontSize:'14px',color:'#1a2340',display:'block'} as const

  return (
    <div style={{minHeight:'100vh',background:'#f4f3f0'}}>
      <header style={{background:'#1a2340',padding:'0 32px',height:'60px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:'Georgia,serif',color:'#fff',fontSize:'18px'}}>Joyau</span>
        <a href="/" style={{color:'#b8975a',fontSize:'13px',textDecoration:'none'}}>← Retour</a>
      </header>
      <main style={{padding:'32px',maxWidth:'600px',margin:'0 auto'}}>
        <h2 style={{fontFamily:'Georgia,serif',fontSize:'22px',color:'#1a2340',marginBottom:'24px'}}>Nouvelle estimation</h2>
        <form onSubmit={handleSubmit} style={{background:'#fff',borderRadius:'12px',padding:'32px',boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
          {[['Nom du client','text','client_name','Jean Dupont'],['Adresse','text','address','12 rue de la Paix'],['Valeur estimée (€)','number','estimated_value','350000']].map(([label,type,field,ph])=>(
            <div key={field} style={{marginBottom:'20px'}}>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</label>
              <input style={inp} type={type} placeholder={ph} required value={(form as any)[field]} onChange={e=>setForm({...form,[field]:e.target.value})} />
            </div>
          ))}
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Statut</label>
            <select style={inp} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="gagne">Gagné</option>
              <option value="perdu">Perdu</option>
            </select>
          </div>
          <div style={{marginBottom:'24px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Notes</label>
            <textarea style={{...inp,height:'80px'}} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Remarques..." />
          </div>
          {error && <p style={{color:'#dc2626',fontSize:'13px',marginBottom:'16px'}}>{error}</p>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:'13px',background:'#1a2340',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',cursor:'pointer'}}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </main>
    </div>
  )
}
