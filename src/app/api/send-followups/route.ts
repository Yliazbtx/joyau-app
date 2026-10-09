import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { secret } = await request.json()
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const in7days = new Date()
  in7days.setDate(in7days.getDate() + 7)

  // Récupérer tous les profils actifs
  const { data: activeProfiles } = await supabase.from('profiles').select('id, full_name, email')
  const activeIds = new Set((activeProfiles || []).map((p: {id: string}) => p.id))
  const profileMap = Object.fromEntries((activeProfiles || []).map((p: {id: string, full_name: string, email?: string}) => [p.id, p]))

  // 1. RELANCES CLIENTS — date dépassée
  const { data: clientRelances } = await supabase
    .from('estimations')
    .select('*')
    .in('status', ['en_attente', 'en_cours'])
    .lte('next_followup', now.toISOString())
    .not('client_email', 'is', null)
    .neq('client_email', '')

  let clientSent = 0
  for (const est of (clientRelances || [])) {
    // Vérifier que le commercial est toujours actif
    if (!activeIds.has(est.user_id)) continue

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Joyau Immobilier <onboarding@resend.dev>',
        to: [est.client_email],
        subject: 'Votre projet immobilier — Joyau Immobilier',
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2340;">
            <h1 style="font-size: 28px; margin-bottom: 4px;">Joyau</h1>
            <p style="color: #b8975a; letter-spacing: 3px; font-size: 11px; margin-top: 0;">IMMOBILIER</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p>Bonjour ${est.client_name},</p>
            <p>Nous revenons vers vous concernant votre projet immobilier pour le bien situé au :</p>
            <p style="background: #f0ede8; padding: 16px; border-radius: 8px; font-weight: bold;">${est.address}</p>
            <p>Votre consultant <strong>${est.commercial_name}</strong> est disponible pour faire le point avec vous.</p>
            <p>N'hésitez pas à le contacter pour avancer ensemble sur votre projet.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="font-size: 13px; color: #9ca3af;">Joyau Immobilier</p>
          </div>`,
      }),
    })

    if (res.ok) {
      const next = new Date()
      next.setDate(next.getDate() + 21)
      await supabase.from('estimations').update({ next_followup: next.toISOString() }).eq('id', est.id)
      clientSent++
    }
  }

  // 2. RELANCES COMMERCIAUX — dans 7 jours
  const { data: commercialRelances } = await supabase
    .from('estimations')
    .select('*')
    .in('status', ['en_attente', 'en_cours'])
    .gte('next_followup', now.toISOString())
    .lte('next_followup', in7days.toISOString())

  // Grouper par commercial
  const byCommercial: Record<string, typeof commercialRelances> = {}
  for (const est of (commercialRelances || [])) {
    if (!activeIds.has(est.user_id)) continue
    if (!byCommercial[est.user_id]) byCommercial[est.user_id] = []
    byCommercial[est.user_id]!.push(est)
  }

  let commercialSent = 0
  for (const [userId, ests] of Object.entries(byCommercial)) {
    const profile = profileMap[userId]
    if (!profile?.email) continue

    const listHtml = (ests || []).map((e: {client_name: string, address: string, next_followup: string}) => `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #f0ede8; font-weight: 600; color: #1a2340;">${e.client_name}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #f0ede8; color: #6b7280; font-size: 13px;">${e.address}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #f0ede8; color: #d97706; font-size: 13px; white-space: nowrap;">${new Date(e.next_followup).toLocaleDateString('fr-FR')}</td>
      </tr>
    `).join('')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Joyau Immobilier <onboarding@resend.dev>',
        to: [profile.email],
        subject: `Rappel — ${(ests || []).length} relance${(ests || []).length > 1 ? 's' : ''} client à venir`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2340;">
            <div style="font-family: Georgia, serif; font-size: 24px; margin-bottom: 4px;">Joyau</div>
            <div style="color: #b8975a; letter-spacing: 3px; font-size: 10px; margin-bottom: 24px;">IMMOBILIER</div>
            <p>Bonjour ${profile.full_name},</p>
            <p>Voici les clients dont la relance est prévue dans les 7 prochains jours :</p>
            <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
              <thead>
                <tr style="background: #f0ede8;">
                  <th style="padding: 10px 16px; text-align: left; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Client</th>
                  <th style="padding: 10px 16px; text-align: left; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Adresse</th>
                  <th style="padding: 10px 16px; text-align: left; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Date relance</th>
                </tr>
              </thead>
              <tbody>${listHtml}</tbody>
            </table>
            <p style="font-size: 13px; color: #9ca3af; margin-top: 24px;">Connectez-vous à Joyau pour gérer vos estimations.</p>
          </div>`,
      }),
    })
    if (res.ok) commercialSent++
  }

  return NextResponse.json({
cat > /Users/$(whoami)/joyau-app/vercel.json << 'EOF'
{
  "crons": [
    {
      "path": "/api/send-followups",
      "schedule": "0 7 * * *"
    }
  ]
}
