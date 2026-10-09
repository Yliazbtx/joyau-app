'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Estimation = {
  id: string
  client_name: string
  address: string
  estimated_value: number
  status: string
  created_at: string
  commercial_name: string
  notes: string
  user_id: string
}

type Profile = {
  role: string
  full_name: string
}

const STATUS_COLORS: Record<string, string> = {
  gagne: '#16a34a',
  perdu: '#dc2626',
  en_cours: '#d97706',
  en_attente: '#6b7280',
}

const STATUS_LABELS: Record<string, string> = {
  gagne: 'Gagné',
  perdu: 'Perdu',
  en_cours: 'En cours',
  en_attente: 'En attente',
}

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

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
      const { data: profileData } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      setProfile(profileData)
      const { data: estData } = await supabase.from('estimations').select('*').order('created_at', { ascending: false })
      const list = estData || []
      setEstimations(list)
      setFiltered(list)
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f3f0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: '#1a2340', marginBottom: '8px' }}>Joyau</div>
        <div style={{ color: '#b8975a', fontSize: '11px', letterSpacing: '3px' }}>IMMOBILIER</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0ede8', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#1a2340', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontFamily: 'Georgia, serif', color: '#fff', fontSize: '20px' }}>Joyau</span>
          <span style={{ color: '#b8975a', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' }}>Immobilier</span>
        </div>
        <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAdmin && (
            <a href="/utilisateurs" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px' }}
              onMouseOver={e => (e.currentTarget.style.color = '#fff')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
              Équipe
            </a>
          )}
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{profile?.full_name}</span>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
            Déconnexion
          </button>
        </nav>
      </header>

      <main style={{ padding: '32px', maxWidth: '1300px', margin: '0 auto' }}>
        {isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Total estimations', value: total, color: '#1a2340' },
              { label: 'Gagnées', value: gagne, color: '#16a34a' },
              { label: 'En cours', value: enCours, color: '#d97706' },
              { label: 'Valeur gagnée', value: fmt(valeurTotale), color: '#b8975a', big: true },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px' }}>{s.label}</div>
                <div style={{ fontSize: s.big ? '22px' : '32px', fontWeight: '700', color: s.color, fontFamily: s.big ? 'system-ui' : 'Georgia, serif' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
            <input type="text" placeholder="Rechercher un client, adresse, commercial..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', width: '320px', outline: 'none', background: '#fff' }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', background: '#fff', cursor: 'pointer', outline: 'none' }}>
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="gagne">Gagné</option>
              <option value="perdu">Perdu</option>
            </select>
          </div>
          <a href="/nouvelle-estimation" style={{ background: '#1a2340', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}>
            + Nouvelle estimation
          </a>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              <p>Aucune estimation</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0ede8' }}>
                  {['Client', 'Adresse', 'Estimation', isAdmin ? 'Commercial' : null, 'Statut', 'Date', ''].filter(Boolean).map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: i === 2 ? 'right' : i === 4 ? 'center' : 'left', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((est, i) => (
                  <tr key={est.id} style={{ borderBottom: '1px solid #f0ede8', background: i % 2 === 0 ? '#fff' : '#fafaf9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1a2340', fontSize: '14px' }}>{est.client_name}</td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '13px', maxWidth: '200px' }}>{est.address}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#1a2340', fontSize: '15px' }}>{fmt(est.estimated_value)}</td>
                    {isAdmin && <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '13px' }}>{est.commercial_name || '—'}</td>}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {editingId === est.id ? (
                        <select defaultValue={est.status} autoFocus
                          onChange={e => updateStatus(est.id, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px', cursor: 'pointer' }}>
                          <option value="en_attente">En attente</option>
                          <option value="en_cours">En cours</option>
                          <option value="gagne">Gagné</option>
                          <option value="perdu">Perdu</option>
                        </select>
                      ) : (
                        <span onClick={() => setEditingId(est.id)}
                          style={{ background: STATUS_COLORS[est.status] + '18', color: STATUS_COLORS[est.status], padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                          title="Cliquer pour modifier">
                          {STATUS_LABELS[est.status] || est.status}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#9ca3af', fontSize: '13px' }}>
                      {new Date(est.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <a href={`/nouvelle-estimation?edit=${est.id}`}
                          style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '15px', opacity: 0.6, padding: '4px', textDecoration: 'none' }}
                          title="Modifier"
                          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                          onMouseOut={e => (e.currentTarget.style.opacity = '0.6')}>
                          ✏️
                        </a>
                        {isAdmin && (
                          <button onClick={() => deleteEstimation(est.id)}
                            style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', opacity: 0.5, padding: '4px' }}
                            title="Supprimer"
                            onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                            onMouseOut={e => (e.currentTarget.style.opacity = '0.5')}>
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ marginTop: '12px', color: '#9ca3af', fontSize: '12px', textAlign: 'right' }}>
          {filtered.length} estimation{filtered.length > 1 ? 's' : ''}
        </div>
      </main>
    </div>
  )
}
