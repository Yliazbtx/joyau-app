'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Header from '@/components/Header'

type Estimation = {
  id: string
  client_name: string
  address: string
  estimated_value: number
  status: string
  created_at: string
  commercial_name: string
  notes: string
}

type Profile = { role: string; full_name: string }

const STATUS_COLORS: Record<string, string> = { gagne: '#16a34a', perdu: '#dc2626', en_cours: '#d97706', en_attente: '#6b7280' }
const STATUS_LABELS: Record<string, string> = { gagne: 'Gagné', perdu: 'Perdu', en_cours: 'En cours', en_attente: 'En attente' }
const fmt = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

export default function HomePage() {
  const [estimations, setEstimations] = useState<Estimation[]>([])
  const [filtered, setFiltered] = useState<Estimation[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [editingId, setEditingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      setProfile(p)
      const { data: e } = await supabase.from('estimations').select('*').order('created_at', { ascending: false })
      setEstimations(e || [])
      setFiltered(e || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let list = [...estimations]
    if (statusFilter !== 'tous') list = list.filter(e => e.status === statusFilter)
    if (search) list = list.filter(e =>
      e.client_name.toLowerCase().includes(search.toLowerCase()) ||
      e.address.toLowerCase().includes(search.toLowerCase()) ||
      (e.commercial_name || '').toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(list)
  }, [search, statusFilter, estimations])

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('estimations').update({ status: newStatus }).eq('id', id)
    setEstimations(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
    setEditingId(null)
  }

  const deleteEstimation = async (id: string) => {
    if (!confirm('Supprimer cette estimation ?')) return
    await supabase.from('estimations').delete().eq('id', id)
    setEstimations(prev => prev.filter(e => e.id !== id))
  }

  const isAdmin = profile?.role === 'manager' || profile?.role === 'admin'
  const total = estimations.length
  const gagne = estimations.filter(e => e.status === 'gagne').length
  const enCours = estimations.filter(e => e.status === 'en_cours').length
  const valeurTotale = estimations.filter(e => e.status === 'gagne').reduce((sum, e) => sum + e.estimated_value, 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0ede8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: '"Cormorant Garant", serif', fontSize: '36px', fontWeight: 600, color: '#1a2340', letterSpacing: '6px' }}>JOYAU</div>
        <div style={{ color: '#b8975a', fontSize: '9px', letterSpacing: '5px', fontFamily: '"Jost", sans-serif', marginTop: '4px' }}>— IMMOBILIER —</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0ede8', fontFamily: '"Jost", sans-serif' }}>
      <Header userName={profile?.full_name} userRole={profile?.role} showTeam={isAdmin} />

      <main style={{ padding: '36px 40px', maxWidth: '1300px', margin: '0 auto' }}>
        {isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '36px' }}>
            {[
              { label: 'Total', value: total, sub: 'estimations' },
              { label: 'Gagnées', value: gagne, sub: 'mandats signés' },
              { label: 'En cours', value: enCours, sub: 'en négociation' },
              { label: fmt(valeurTotale), value: null, sub: 'valeur gagnée', gold: true },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '22px 26px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#b8975a', marginBottom: '10px', fontWeight: 500 }}>{s.label}</div>
                {s.value !== null && <div style={{ fontSize: '40px', fontWeight: 700, color: '#1a2340', fontFamily: '"Cormorant Garant", serif', lineHeight: 1 }}>{s.value}</div>}
                {s.gold && <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a2340', fontFamily: '"Cormorant Garant", serif', lineHeight: 1 }}>{s.label}</div>}
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2ddd8', fontSize: '14px', width: '280px', outline: 'none', background: '#fff', fontFamily: '"Jost", sans-serif' }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2ddd8', fontSize: '14px', background: '#fff', cursor: 'pointer', outline: 'none', fontFamily: '"Jost", sans-serif' }}>
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="gagne">Gagné</option>
              <option value="perdu">Perdu</option>
            </select>
          </div>
          <a href="/nouvelle-estimation" style={{ background: '#1a2340', color: '#fff', padding: '11px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: '"Jost", sans-serif' }}>
            + Nouvelle estimation
          </a>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>
              <div style={{ fontFamily: '"Cormorant Garant", serif', fontSize: '22px', color: '#c9c3bb', marginBottom: '8px' }}>Aucune estimation</div>
              <div style={{ fontSize: '13px' }}>Commencez par créer votre première estimation</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0ede8' }}>
                  {['Client', 'Adresse', 'Estimation', isAdmin ? 'Commercial' : null, 'Statut', 'Date', ''].filter(Boolean).map((h, i) => (
                    <th key={i} style={{ padding: '14px 18px', textAlign: i === 2 ? 'right' : i === 4 ? 'center' : 'left', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#b8975a', fontWeight: 600, fontFamily: '"Jost", sans-serif' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((est, i) => (
                  <tr key={est.id} style={{ borderBottom: '1px solid #f7f5f2', background: i % 2 === 0 ? '#fff' : '#fdfcfb' }}>
                    <td style={{ padding: '16px 18px', fontWeight: 600, color: '#1a2340', fontSize: '15px', fontFamily: '"Cormorant Garant", serif' }}>{est.client_name}</td>
                    <td style={{ padding: '16px 18px', color: '#6b7280', fontSize: '13px' }}>{est.address}</td>
                    <td style={{ padding: '16px 18px', textAlign: 'right', fontWeight: 700, color: '#1a2340', fontSize: '16px', fontFamily: '"Cormorant Garant", serif' }}>{fmt(est.estimated_value)}</td>
                    {isAdmin && <td style={{ padding: '16px 18px', color: '#6b7280', fontSize: '13px' }}>{est.commercial_name || '—'}</td>}
                    <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                      {editingId === est.id ? (
                        <select defaultValue={est.status} autoFocus onChange={e => updateStatus(est.id, e.target.value)} onBlur={() => setEditingId(null)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2ddd8', fontSize: '12px', fontFamily: '"Jost", sans-serif' }}>
                          <option value="en_attente">En attente</option>
                          <option value="en_cours">En cours</option>
                          <option value="gagne">Gagné</option>
                          <option value="perdu">Perdu</option>
                        </select>
                      ) : (
                        <span onClick={() => setEditingId(est.id)} title="Cliquer pour modifier"
                          style={{ background: STATUS_COLORS[est.status] + '15', color: STATUS_COLORS[est.status], padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px', fontFamily: '"Jost", sans-serif' }}>
                          {STATUS_LABELS[est.status]}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 18px', color: '#9ca3af', fontSize: '13px' }}>{new Date(est.created_at).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      {isAdmin && <button onClick={() => deleteEstimation(est.id)}
                        style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px', opacity: 0.3, padding: '4px 8px' }}
                        onMouseOver={e => (e.currentTarget.style.opacity = '1')} onMouseOut={e => (e.currentTarget.style.opacity = '0.3')}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ marginTop: '10px', color: '#b8b0a8', fontSize: '12px', textAlign: 'right', letterSpacing: '0.5px' }}>
          {filtered.length} estimation{filtered.length > 1 ? 's' : ''}
        </div>
      </main>
    </div>
  )
}
