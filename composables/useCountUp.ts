// Composable que anima un número desde 0 hasta el valor objetivo cuando
// el componente se monta, o desde el valor previo al nuevo cuando cambia.
// Usar en analíticas: <span>{{ animated }}</span>
//
// Uso:
//   const realCount = computed(() => habits.length)
//   const animated = useCountUp(realCount, { duration: 700 })
//   <span class="tabular-nums">{{ animated }}</span>

import { ref, watch, onMounted, type Ref } from 'vue'

export interface CountUpOptions {
  /** Duración total en ms (default 700) */
  duration?: number
  /** Curva de easing custom (t en [0,1]). Default ease-out-quart. */
  easing?: (t: number) => number
  /** Decimales a mostrar (default 0) */
  decimals?: number
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

export function useCountUp(target: Ref<number> | (() => number), opts: CountUpOptions = {}) {
  const duration = opts.duration ?? 700
  const easing = opts.easing ?? easeOutQuart
  const decimals = opts.decimals ?? 0

  const getTarget = (): number => {
    const v = typeof target === 'function' ? (target as () => number)() : target.value
    return Number.isFinite(v) ? v : 0
  }

  const value = ref(0)
  let raf: number | undefined
  let startTime = 0
  let fromValue = 0
  let toValue = 0

  function animate() {
    if (typeof window === 'undefined') {
      value.value = toValue
      return
    }
    if (raf) cancelAnimationFrame(raf)
    startTime = performance.now()
    fromValue = value.value
    const tick = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / duration)
      const eased = easing(t)
      const next = fromValue + (toValue - fromValue) * eased
      value.value = Number(next.toFixed(decimals))
      if (t < 1) raf = requestAnimationFrame(tick)
      else raf = undefined
    }
    raf = requestAnimationFrame(tick)
  }

  onMounted(() => {
    toValue = getTarget()
    value.value = 0
    animate()
  })

  watch(
    () => getTarget(),
    (newTarget) => {
      toValue = newTarget
      animate()
    },
  )

  return value
}
