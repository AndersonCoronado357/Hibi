// Persistencia del estado de la mascota. El servidor es la fuente entre
// dispositivos; localStorage sigue siendo la caché offline (en la página).
export interface PetSnapshot {
  energia: number
  pancita: number
  carino: number
  diversion: number
  coins: number
  streak: number
  room: string
  inventory: Record<string, number>
  lastCareDay: string
  lastTick: number // ms epoch
}

function normalize(row: any): PetSnapshot | null {
  if (!row) return null
  return {
    energia: row.energia, pancita: row.pancita, carino: row.carino, diversion: row.diversion,
    coins: row.coins, streak: row.streak, room: row.room || 'casa',
    inventory: row.inventory && typeof row.inventory === 'object' ? row.inventory : {},
    lastCareDay: row.lastCareDay || '',
    lastTick: row.lastTick ? Date.parse(row.lastTick) : 0,
  }
}

export function usePet() {
  const rfetch = useRequestFetch()

  async function fetchPet(): Promise<PetSnapshot | null> {
    try { return normalize(await rfetch('/api/pet')) } catch { return null }
  }

  const push = (p: PetSnapshot) => $fetch('/api/pet', {
    method: 'PATCH',
    body: {
      energia: p.energia, pancita: p.pancita, carino: p.carino, diversion: p.diversion,
      coins: p.coins, streak: p.streak, room: p.room,
      inventory: p.inventory, lastCareDay: p.lastCareDay, lastTick: p.lastTick,
    },
  }).catch(() => { /* offline: la caché local ya guardó */ })

  const debounced = useDebounceFn(push, 800)
  function savePet(pet: PetSnapshot) {
    if (import.meta.client) debounced({ ...pet, inventory: { ...pet.inventory } })
  }

  return { fetchPet, savePet }
}
