<script setup lang="ts">
// Anillo de progreso CON FORMA DE NUBE. El path es el contorno OUTER
// de los 6 círculos de la HibiCloud (uniendo tangentes entre círculos
// vecinos). Se anima con stroke-dashoffset igual que un anillo circular,
// pero el trazo sigue la silhueta de la nube.
//
// Path construido a partir de las tangentes externas calculadas entre los
// 6 círculos del cloud (C1..C6 en HibiCloud.vue).

const props = withDefaults(defineProps<{
  /** Ancho en px (alto se calcula automáticamente proporcional 140:95) */
  size?: number
  /** Grosor del trazo (en unidades del viewBox 140x95) */
  strokeWidth?: number
  /** Color del trazo de fondo (CSS) */
  trackColor?: string
  /** Color del trazo de progreso (CSS) */
  progressColor?: string
  /** Progreso 0..1 */
  progress?: number
}>(), {
  size: 420,
  strokeWidth: 6,
  trackColor: 'var(--bg-muted)',
  progressColor: 'var(--color-sky-deep)',
  progress: 0,
})

// Mantiene la misma proporción visible: el viewBox extendido (152x107) ahora
// se renderiza en el ancho dado, así que la altura es proporcional al viewBox.
const h = computed(() => Math.round((props.size * 107) / 152))

// PATH del contorno OUTER de la nube. Recorre clockwise (en coords SVG)
// desde la tangente C1↔C2 (arriba-izq) por C2, C4, C5, C6, C3, C1 y cierra.
const CLOUD_PATH =
  'M 25.4 25.4' +
  ' A 30 30 0 0 1 82.6 18.3' +
  ' A 25 25 0 0 1 119.6 35.4' +
  ' A 25 25 0 0 1 105.2 83' +
  ' A 20 20 0 0 1 80 87.3' +
  ' A 30 30 0 0 1 36.9 84.2' +
  ' A 30 30 0 0 1 25.4 25.4' +
  ' Z'

// Longitud aproximada del path (medida con DOMRef o calculada). Usamos un
// valor empírico medido en runtime para que el dashoffset funcione bien.
const pathRef = ref<SVGPathElement | null>(null)
const totalLen = ref(360) // valor inicial razonable; se actualiza al montar
onMounted(() => {
  if (pathRef.value) totalLen.value = pathRef.value.getTotalLength()
})

const dashOffset = computed(() => totalLen.value * (1 - Math.max(0, Math.min(1, props.progress))))
</script>

<template>
  <!-- viewBox con padding (-6 a 146/101) para que el stroke completo del cloud
       no quede recortado por el borde del SVG. -->
  <svg :width="size" :height="h" viewBox="-6 -6 152 107" fill="none" aria-hidden="true">
    <!-- Track (silhueta pálida del contorno) -->
    <path
      :d="CLOUD_PATH"
      :stroke="trackColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <!-- Progress (mismo contorno, parcialmente trazado) -->
    <path
      ref="pathRef"
      :d="CLOUD_PATH"
      :stroke="progressColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
      :stroke-dasharray="totalLen"
      :stroke-dashoffset="dashOffset"
      style="transition: stroke-dashoffset 0.6s ease;"
    />
  </svg>
</template>
