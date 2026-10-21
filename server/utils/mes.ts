/** Mes actual como yyyy-MM. Los gastos fijos se versionan por mes. */
export function mesActual(d = new Date()): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}
