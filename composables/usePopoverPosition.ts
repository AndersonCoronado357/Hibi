import type { Ref } from 'vue'

interface Pos {
  top: number
  left: number
  width: number
  maxHeight: number
  placement: 'down' | 'up'
}

/**
 * Calcula la posicion de un popover anclado a un trigger.
 * Auto-flip arriba/abajo segun espacio disponible en el viewport.
 * Devuelve tambien maxHeight para que el popover no se salga de pantalla
 * (utilizar con `max-height: <maxHeight>px` y `overflow-y: auto`).
 *
 * Si `matchTriggerWidth` es true, el popover toma el ancho del trigger.
 * Si es false, mantiene su ancho intrinseco pero se clampa al viewport.
 *
 * `desiredHeight` es la altura ideal del popover (lista de opciones,
 * calendario, etc.). Usamos esto para decidir si cabe abajo o no.
 */
export function placePopover(
  triggerRect: DOMRect,
  opts: {
    desiredHeight?: number
    desiredWidth?: number
    matchTriggerWidth?: boolean
    gap?: number
    edgeMargin?: number
  } = {},
): Pos {
  const desiredHeight = opts.desiredHeight ?? 280
  const desiredWidth = opts.desiredWidth ?? triggerRect.width
  const matchTriggerWidth = opts.matchTriggerWidth ?? false
  const gap = opts.gap ?? 6
  const edgeMargin = opts.edgeMargin ?? 12

  const vw = window.innerWidth
  const vh = window.innerHeight

  const spaceBelow = vh - triggerRect.bottom - edgeMargin
  const spaceAbove = triggerRect.top - edgeMargin

  // Abrir arriba solo si no cabe minimamente abajo Y arriba hay mas espacio
  const minComfortBelow = 200
  const openUp = spaceBelow < minComfortBelow && spaceAbove > spaceBelow

  const maxHeight = Math.min(desiredHeight, openUp ? spaceAbove : spaceBelow)

  const width = matchTriggerWidth ? triggerRect.width : Math.min(desiredWidth, vw - edgeMargin * 2)

  // Clampar left para no salir del viewport
  let left = triggerRect.left
  if (left + width > vw - edgeMargin) left = vw - edgeMargin - width
  if (left < edgeMargin) left = edgeMargin

  const top = openUp ? triggerRect.top - maxHeight - gap : triggerRect.bottom + gap

  return { top, left, width, maxHeight, placement: openUp ? 'up' : 'down' }
}

/**
 * Helper reactivo. Devuelve un ref con la posicion calculada y una funcion
 * para recalcular (llamala al abrir, hacer scroll, resize).
 */
export function usePopoverPosition(triggerRef: Ref<HTMLElement | null>, opts?: Parameters<typeof placePopover>[1]) {
  const pos = ref<Pos>({ top: 0, left: 0, width: 0, maxHeight: 280, placement: 'down' })
  function recalc() {
    if (!triggerRef.value) return
    pos.value = placePopover(triggerRef.value.getBoundingClientRect(), opts)
  }
  return { pos, recalc }
}
