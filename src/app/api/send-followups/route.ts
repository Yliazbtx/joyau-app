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

  const now = new Date().toISOString()
  const { data: estimations, error } = await supabase
    .from('estimations')
    .select('*')
    .in('status', ['en_attente', 'en_cours'])
    .lte('next_followup', now)
    .not('client_email', 'is', null)
    .neq('client_email', '')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!estimations || estimations.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Aucune relance à envoyer' })
  }

  const results = []
  for (const est of estimations) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
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
              <p>Votre commercial <strong>${est.commercial_name}</strong> est disponible pour faire le point avec vous et répondre à toutes vos questions.</p>
              <p>N'hésitez pas à le contacter pour avancer ensemble sur votre projet.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="font-size: 13px; color: #9ca3af;">Joyau Immobilier</p>
            </div>
          `,
        }),
      })

      if (res.ok) {
        const nextFollowup = new Date()
        nextFollowup.setDate(nextFollowup.getDate() + 21)
        await supabase.from('estimations').update({ next_followup: nextFollowup.toISOString() }).eq('id', est.id)
        results.push({ id: est.id, status: 'sent' })
      } else {
        results.push({ id: est.id, status: 'error' })
      }
    } catch {
      results.push({ id: est.id, status: 'exception' })
    }
  }

  return NextResponse.json({ sent: results.filter(r => r.status === 'sent').length, results })
}
