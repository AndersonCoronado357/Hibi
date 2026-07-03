// Empieza a reproducir en el dispositivo del SDK (transfiere + reproduce).
// body: { deviceId, contextUri? (playlist/álbum), uris? (canciones sueltas) }
import { z } from 'zod'

const Body = z.object({
  deviceId: z.string().min(1),
  contextUri: z.string().optional(),
  uris: z.array(z.string()).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const body: Record<string, unknown> = {}
  if (b.contextUri) body.context_uri = b.contextUri
  if (b.uris?.length) body.uris = b.uris
  await spotifyApi(userId, `/me/player/play?device_id=${encodeURIComponent(b.deviceId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return { ok: true }
})
