// Correo por Resend (portado de acmsy shared/mailer). Sin dependencias (fetch).
const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const APP_NAME = 'Hibi'

function senderFor(): string {
  const address = process.env.MAIL_FROM || useRuntimeConfig().mailFrom || 'noreply@acmsy.com'
  return `${APP_NAME} <${address}>`
}

export async function sendEmail(o: { to: string | string[]; subject: string; html?: string; text?: string }) {
  const apiKey = process.env.RESEND_API_KEY || useRuntimeConfig().resendApiKey
  if (!apiKey) throw new Error('Falta RESEND_API_KEY')
  const payload: Record<string, unknown> = {
    from: senderFor(),
    to: Array.isArray(o.to) ? o.to : [o.to],
    subject: o.subject,
  }
  if (o.html) payload.html = o.html
  if (o.text) payload.text = o.text
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({})) as { id?: string; message?: string }
  if (!res.ok) throw new Error(data.message || ('Resend devolvió un error ' + res.status))
  return { ok: true, id: data.id }
}

// Plantilla de recuperación de contraseña (Hibi).
export function passwordResetEmail(url: string, minutes = 30) {
  const subject = 'Recupera tu acceso a Hibi'
  const text = `Recibimos una solicitud para restablecer tu contraseña de Hibi.\n\nAbre este enlace (válido ${minutes} min):\n${url}\n\nSi no fuiste tú, ignora este correo.`
  const html = `<div style="font-family:system-ui,sans-serif;max-width:440px;margin:0 auto;color:#1c4258">
  <h2 style="color:#1c4258">Recupera tu acceso a Hibi</h2>
  <p>Recibimos una solicitud para restablecer tu contraseña.</p>
  <p><a href="${url}" style="display:inline-block;background:#5aa6d2;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:700">Crear nueva contraseña</a></p>
  <p style="color:#5a7488;font-size:13px">El enlace vence en ${minutes} minutos. Si no fuiste tú, ignora este correo.</p>
</div>`
  return { subject, text, html }
}
