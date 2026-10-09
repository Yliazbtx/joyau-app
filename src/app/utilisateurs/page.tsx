'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Profile = {
  id: string
  full_name: string
  role: string
  created_at: string
}

const ROLE_LABELS: Record<string, string> = { manager: 'Manager', admin: 'Admin', commercial: 'Commercial' }
const ROLE_COLORS: Record<string, string> = { manager: '#7c3aed', admin: '#b8975a', commercial: '#1a2340' }

export default function UtilisateursPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'commercial', password: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [reassignTo, setReassignTo] = useState('')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!me || (me.role !== 'manager' && me.role !== 'admin')) { router.push('/'); return }
      setMyProfile(me)
      const { data: all } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
      setProfiles(all || [])
      setLoading(false)
    }
    load()
  }, [])

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setSuccess('')
    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erreur lors de la création'); setCreating(false); return }
    setSuccess(`Compte créé pour ${newUser.full_name}`)
    setNewUser({ email: '', full_name: '', role: 'commercial', password: '' })
    setShowForm(false)
    const { data: all } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    setProfiles(all || [])
    setCreating(false)
  }

  const updateRole = async (id: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', id)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p))
  }

  const confirmDelete = async () => {
    if (!deleteTarget || !reassignTo) return
    setDeleting(true)
    const target = profiles.find(p => p.id === reassignTo)
    if (target) {
      await supabase.from('estimations')
        .update({ user_id: reassignTo, commercial_name: target.full_name })
        .eq('user_id', deleteTarget.id)
    }
    await supabase.from('profiles').delete().eq('id', deleteTarget.id)
    setProfiles(prev => prev.filter(p => p.id !== deleteTarget.id))
    setDeleteTarget(null)
    setReassignTo('')
    setDeleting(false)
    setSuccess(`${deleteTarget.full_name} supprimé, estimations réattribuées à ${target?.full_name}`)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const, background: '#fff',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0ede8' }}>
      <p style={{ color: '#9ca3af' }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0ede8', fontFamily: 'system-ui, sans-serif' }}>
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#1a2340', marginBottom: '8px' }}>Supprimer {deleteTarget.full_name}</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Les estimations de ce collaborateur seront réattribuées à :</p>
            <select value={reassignTo} onChange={e => setReassignTo(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }}>
              <option value="">— Choisir un collaborateur —</option>
              {profiles.filter(p => p.id !== deleteTarget.id).map(p => (
                <option key={p.id} value={p.id}>{p.full_name} ({ROLE_LABELS[p.role] || p.role})</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setDeleteTarget(null); setReassignTo('') }}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#6b7280' }}>
                Annuler
              </button>
              <button onClick={confirmDelete} disabled={!reassignTo || deleting}
                style={{ flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: reassignTo ? 'pointer' : 'not-allowed', opacity: reassignTo ? 1 : 0.5 }}>
                {deleting ? 'Suppression...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header style={{ background: '#1a2340', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontFamily: 'Georgia, serif', color: '#fff', fontSize: '20px' }}>Joyau</span>
          <span style={{ color: '#b8975a', fontSize: '10px', letterSpacing: '3px' }}>IMMOBILIER</span>
        </div>
        <a href="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none' }}>← Retour</a>
      </header>

      <main style={{ padding: '40px 32px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', color: '#1a2340', marginBottom: '4px' }}>Équipe</h1>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>{profiles.length} membre{profiles.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ background: '#1a2340', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
            {showForm ? 'Annuler' : '+ Ajouter un membre'}
          </button>
        </div>

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            ✓ {success}
          </div>
        )}

        {showForm && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: '#b8975a', marginBottom: '20px', fontWeight: '600' }}>Nouveau membre</h3>
            <form onSubmit={createUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nom complet *</label>
                  <input style={inputStyle} type="text" placeholder="Prénom Nom" value={newUser.full_name}
                    onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email *</label>
                  <input style={inputStyle} type="email" placeholder="prenom@joyau-immobilier.com" value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mot de passe *</label>
                  <input style={inputStyle} type="text" placeholder="Mot de passe temporaire" value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })} required minLength={6} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rôle *</label>
                  <select style={inputStyle} value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                    <option value="commercial">Commercial</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>
              {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
              <button type="submit" disabled={creating}
                style={{ background: '#1a2340', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                {creating ? 'Création...' : 'Créer le compte'}
              </button>
            </form>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0ede8' }}>
                {['Nom', 'Rôle', 'Membre depuis', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f0ede8', background: i % 2 === 0 ? '#fff' : '#fafaf9' }}>
                  <td style={{ padding: '16px', fontWeight: '600', color: '#1a2340' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1a2340', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b8975a', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
                        {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      {p.full_name}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {p.id === myProfile?.id ? (
                      <span style={{ background: ROLE_COLORS[p.role] + '18', color: ROLE_COLORS[p.role], padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {ROLE_LABELS[p.role] || p.role}
                      </span>
                    ) : (
                      <select value={p.role} onChange={e => updateRole(p.id, e.target.value)}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px', background: '#fff', cursor: 'pointer', fontWeight: '600', color: ROLE_COLORS[p.role] || '#1a2340' }}>
                        <option value="commercial">Commercial</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                      </select>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: '#9ca3af', fontSize: '13px' }}>
                    {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {p.id === myProfile?.id ? (
                      <span style={{ fontSize: '11px', color: '#9ca3af', background: '#f0ede8', padding: '3px 8px', borderRadius: '4px' }}>Vous</span>
                    ) : (
                      <button onClick={() => { setDeleteTarget(p); setReassignTo('') }}
                        style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '13px', opacity: 0.5, padding: '4px 8px' }}
                        title="Supprimer ce membre"
                        onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                        onMouseOut={e => (e.currentTarget.style.opacity = '0.5')}>
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
