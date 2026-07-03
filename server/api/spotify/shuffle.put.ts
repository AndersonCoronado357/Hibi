// Activa/desactiva el modo aleatorio de la reproducción.
import { z } from 'zod'

const Body = z.object({ state: z.boolean() })

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  await spotifyApi(userId, `/me/player/shuffle?state=${b.state}`, { method: 'PUT' })
  return { ok: true }
})
