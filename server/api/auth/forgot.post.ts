// Solicitud de recuperación: genera token, lo guarda hasheado y envía el correo.
// Responde siempre ok (no revela si el correo existe).
import { z } from 'zod'

const schema = z.object({ email: z.string().trim().toLowerCase().email() })
const RESET_MINUTES = 30

export default defineEventHandler(async (event) => {
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) return { ok: true }
  const user = await findUserByEmail(parsed.data.email)

  if (user) {
    const token = randomToken(32)
    const expiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000)
    await createResetToken(user.id, sha256(token), expiresAt)

    const cfg = useRuntimeConfig()
    const origin = process.env.ORIGIN || cfg.origin || 'http://localhost:3100'
    const url = `${origin}/reset?token=${token}`
    const mail = passwordResetEmail(url, RESET_MINUTES)
    try {
      await sendEmail({ to: user.email, subject: mail.subject, html: mail.html, text: mail.text })
    } catch (err) {
      // En dev (sin RESEND_API_KEY) dejamos el enlace en el log del servidor.
      console.warn('[forgot] no se pudo enviar el correo; enlace de reset:', url, String(err))
    }
  }
  return { ok: true }
})
