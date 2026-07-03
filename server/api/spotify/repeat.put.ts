// Modo de repetición: off (nada), context (playlist) o track (una canción).
import { z } from 'zod'

const Body = z.object({ state: z.enum(['off', 'context', 'track']) })

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  await spotifyApi(userId, `/me/player/repeat?state=${b.state}`, { method: 'PUT' })
  return { ok: true }
})
