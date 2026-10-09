import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Vérification clé secrète
  const { secret } = await request.json()
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()

  // Récupère les estimations à relancer
  const { data: estimations } = await supabase
    .from('estimations')
    .select('*, profiles:user_id(full_name, email)')
    .in('status', ['en_attente', 'en_cours'])
    .lte('next_followup', now)
    .not('client_email', 'is', null)

  if (!estimations || estimations.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  const errors = []

  for (const est of estimations) {
    try {
      // Email au client
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Joyau Immobilier <onboarding@resend.dev>',
          to: est.client_email,
          subject: 'Votre projet immobilier — Joyau Immobilier',
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #1a2340; font-size: 24px; margin-bottom: 8px;">Joyau Immobilier</h1>
              <p style="color: #b8975a; letter-spacing: 3px; font-size: 11px; margin-bottom: 32px;">IMMOBILIER</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">Bonjour ${est.client_name},</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Votre projet d'estimation au <strong>${est.address}</strong> est toujours suivi par notre équipe.
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                N'hésitez pas à contacter votre conseiller pour faire avancer votre projet.
              </p>
              <p style="color: #9ca3af; font-size: 14px; margin-top: 40px;">
                L'équipe Joyau Immobilier<br>
                34 Rue du Languedoc, 31000 Toulouse<br>
                05 31 61 91 31
              </p>
            </div>
          `,
        }),
      })

      // Repousse la relance à J+21
      const nextFollowup = new Date()
      nextFollowup.setDate(nextFollowup.getDate() + 21)
      await supabase
        .from('estimations')
        .update({ next_followup: nextFollowup.toISOString() })
        .eq('id', est.id)

      sent++
    } catch (err) {
      errors.push({ id: est.id, error: String(err) })
    }
  }

  return NextResponse.json({ sent, errors })
}
