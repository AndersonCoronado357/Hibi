// Clave pública VAPID para que el cliente se suscriba. Se lee de process.env
// en caliente (no del runtimeConfig horneado en el build) — mismo motivo que
// server/utils/webPush.ts: en prod el env_file se aplica al arrancar el
// contenedor, después de que el build ya corrió.
export default defineEventHandler(async () => {
  const cfg = useRuntimeConfig()
  const publicKey = process.env.VAPID_PUBLIC_KEY || (cfg.public as any).vapidPublicKey as string
  return { publicKey }
})
