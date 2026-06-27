// Cierra la sesión (borra la cookie firmada).
export default defineEventHandler((event) => {
  clearAuthSession(event)
  return { ok: true }
})
