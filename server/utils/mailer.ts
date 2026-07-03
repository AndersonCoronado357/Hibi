// Correo por Resend (portado de acmsy shared/mailer). Sin dependencias (fetch).
import { HIBI_CLOUD_PNG_B64 } from './mailerAssets'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

function senderFor(): string {
  const cfg = useRuntimeConfig()
  const address = process.env.MAIL_FROM || (cfg.mailFrom as string) || 'noreply@acmsy.com'
  const name = process.env.MAIL_FROM_NAME || (cfg.mailFromName as string) || 'Hibi'
  return name ? `${name} <${address}>` : address
}

export async function sendEmail(o: { to: string | string[]; subject: string; html?: string; text?: string; attachments?: unknown[] }) {
  const apiKey = process.env.RESEND_API_KEY || useRuntimeConfig().resendApiKey
  if (!apiKey) throw new Error('Falta RESEND_API_KEY')
  const payload: Record<string, unknown> = {
    from: senderFor(),
    to: Array.isArray(o.to) ? o.to : [o.to],
    subject: o.subject,
  }
  if (o.html) payload.html = o.html
  if (o.text) payload.text = o.text
  if (o.attachments && o.attachments.length) payload.attachments = o.attachments
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({})) as { id?: string; message?: string }
  if (!res.ok) throw new Error(data.message || ('Resend devolvió un error ' + res.status))
  return { ok: true, id: data.id }
}

// Plantilla de recuperación de contraseña con la estética de Hibi (azul cielo
// pastel, nube con carita, tarjeta redondeada). HTML con estilos EN LÍNEA y
// tablas para que se vea bien en Gmail/Apple Mail/Outlook. La nube es SVG en
// línea: los clientes que no lo soporten (Gmail) simplemente no la muestran y
// la cabecera sigue viéndose limpia.
export function passwordResetEmail(url: string, minutes = 30) {
  const subject = 'Recupera tu acceso a Hibi'
  const text = `Recupera tu acceso a Hibi

Recibimos una solicitud para restablecer tu contraseña.
Crea una nueva desde este enlace (vence en ${minutes} minutos):
${url}

Si no fuiste tú, puedes ignorar este correo.

Hibi, tu organización personal`

  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
  // Nube del login INCRUSTADA en el propio correo (adjunto en línea con cid).
  // Así se ve en Gmail sin depender de ningún servidor (ni localhost ni acmsy).
  const cloud = `<img src="cid:hibicloud" width="132" height="89" alt="Hibi" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;">`
  // Degradado del login (.mode-forgot): cielo #a6d6f0 arriba → blanco abajo.
  // background-color es el fallback para clientes que no soportan gradientes (Gmail).
  const grad = 'linear-gradient(to bottom,#a6d6f0 0%,#a6d6f0 40%,#ffffff 66%,#ffffff 100%)'

  const html = `<div style="margin:0;padding:0;background:#e6f3fb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e6f3fb;">
    <tr><td align="center" style="padding:44px 16px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:480px;background-color:#d9edfa;background:${grad};border-radius:24px;overflow:hidden;font-family:${font};">
        <tr><td align="center" style="padding:56px 30px 12px;">
          <div style="line-height:0;">${cloud}</div>
          <div style="margin:26px 0 12px;font-size:24px;font-weight:800;color:#1c4258;letter-spacing:-0.01em;">Recupera tu acceso</div>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#2c6189;font-weight:500;">Crea una contraseña nueva desde el botón. Si no fuiste tú, puedes ignorar este correo.</p>
        </td></tr>
        <tr><td align="center" style="padding:40px 34px 12px;">
          <a href="${url}" style="display:inline-block;background:#5aa6d2;color:#ffffff;text-decoration:none;padding:16px 34px;border-radius:16px;font-size:15px;font-weight:700;">Crear nueva contraseña</a>
          <p style="margin:30px 0 0;font-size:13px;color:#7a93a6;">El enlace vence en ${minutes} minutos.</p>
        </td></tr>
        <tr><td align="center" style="padding:28px 34px 52px;">
          <p style="margin:0 0 6px;font-size:12px;color:#9fb2c2;">Si el botón no funciona, copia y pega este enlace:</p>
          <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${url}" style="color:#5aa6d2;text-decoration:underline;">${url}</a></p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11.5px;color:#9fb2c2;font-family:${font};">Hibi, tu organización personal</p>
    </td></tr>
  </table>
</div>`
  // La nube viaja dentro del correo (cid: hibicloud) → visible en Gmail sin servidor.
  const attachments = [{ filename: 'hibi-cloud.png', content: HIBI_CLOUD_PNG_B64, content_id: 'hibicloud', content_type: 'image/png' }]
  return { subject, text, html, attachments }
}
