'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function NouvelleEstimationPage() {
  const [form, setForm] = useState({
    client_name: '',
    address: '',
    estimated_value: '',
    notes: '',
    status: 'en_attente',
  })
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
      setProfile(data)

      const editParam = searchParams.get('edit')
      if (editParam) {
        setEditId(editParam)
        const { data: est } = await supabase.from('estimations').select('*').eq('id', editParam).single()
        if (est) {
          setForm({
            client_name: est.client_name,
            address: est.address,
            estimated_value: String(est.estimated_value),
            notes: est.notes || '',
            status: est.status,
          })
        }
      }
      setPageLoading(false)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    if (editId) {
      const { error: err } = await supabase.from('estimations').update({
        client_name: form.client_name,
        address: form.address,
        estimated_value: parseFloat(form.estimated_value),
        notes: form.notes,
        status: form.status,
      }).eq('id', editId)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('estimations').insert({
        client_name: form.client_name,
        address: form.address,
        estimated_value: parseFloat(form.estimated_value),
        notes: form.notes,
        status: form.status,
        commercial_name: profile?.full_name || '',
        user_id: user.id,
      })
      if (err) { setError(err.message); setLoading(false); return }
    }

    router.push('/')
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '8px',
    border: '1px solid #e5e7eb', fontSize: '15px', outline: 'none',
    boxSizing: 'border-box' as const, background: '#fff', color: '#1a2340',
  }
  const labelStyle = {
    display: 'block' as const, fontSize: '12px', letterSpacing: '1px',
    textTransform: 'uppercase' as const, color: '#6b7280', marginBottom: '6px', fontWeight: '600' as const,
  }

  if (pageLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0ede8' }}>
      <p style={{ color: '#9ca3af' }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0ede8', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#1a2340', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontFamily: 'Georgia, serif', color: '#fff', fontSize: '20px' }}>Joyau</span>
          <span style={{ color: '#b8975a', fontSize: '10px', letterSpacing: '3px' }}>IMMOBILIER</span>
        </div>
        <a href="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none' }}>← Retour</a>
      </header>

      <main style={{ padding: '40px 32px', maxWidth: '640px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', color: '#1a2340', marginBottom: '8px' }}>
          {editId ? 'Modifier l\'estimation' : 'Nouvelle estimation'}
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '32px' }}>
          {editId ? 'Modifiez les informations du bien' : 'Renseignez les informations du bien à estimer'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: '#b8975a', marginBottom: '20px', fontWeight: '600' }}>Informations client</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nom du client *</label>
                <input style={inputStyle} type="text" placeholder="Ex: Jean Dupont" value={form.client_name}
                  onChange={e => setForm({ ...form, client_name: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Adresse du bien *</label>
                <input style={inputStyle} type="text" placeholder="Ex: 12 rue de la Paix, 75001 Paris" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })} required />
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: '#b8975a', marginBottom: '20px', fontWeight: '600' }}>Estimation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Valeur estimée (€) *</label>
                <input style={inputStyle} type="number" placeholder="Ex: 450000" value={form.estimated_value}
                  onChange={e => setForm({ ...form, estimated_value: e.target.value })} required min="0" />
              </div>
              <div>
                <label style={labelStyle}>Statut</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="en_attente">En attente</option>
                  <option value="en_cours">En cours</option>
                  <option value="gagne">Gagné</option>
                  <option value="perdu">Perdu</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Notes (optionnel)</label>
                <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Informations complémentaires..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '14px', background: '#fef2f2', padding: '12px 16px', borderRadius: '8px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="/" style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #e5e7eb', color: '#6b7280', borderRadius: '8px', textDecoration: 'none', textAlign: 'center', fontSize: '15px' }}>
              Annuler
            </a>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', background: '#1a2340', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              {loading ? 'Enregistrement...' : (editId ? 'Enregistrer les modifications' : 'Enregistrer l\'estimation')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
