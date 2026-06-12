<script setup lang="ts">
// Fondo ambiental del shell. Las nubes usan blanco SÓLIDO con opacidad
// aplicada al elemento (opacity-*), nunca color semitransparente: así los
// solapes de las circunferencias no se acumulan ni se oscurecen.
const stars = [
  { top: '12%', left: '18%', s: 3 },
  { top: '24%', left: '64%', s: 2 },
  { top: '40%', left: '38%', s: 2 },
  { top: '58%', left: '78%', s: 3 },
  { top: '70%', left: '22%', s: 2 },
  { top: '82%', left: '52%', s: 3 },
  { top: '16%', left: '88%', s: 2 },
]
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <HibiCloud
      :size="240"
      class="absolute -top-8 right-[6%] text-white opacity-[0.6] dark:opacity-[0.05] hibi-float"
    />
    <HibiCloud
      :size="160"
      class="absolute top-[34%] -left-12 text-white opacity-[0.45] dark:opacity-[0.04] hibi-float-slow"
    />
    <HibiCloud
      :size="190"
      class="absolute bottom-[7%] right-[24%] text-white opacity-[0.5] dark:opacity-[0.04] hibi-float"
    />
    <template v-for="(st, i) in stars" :key="i">
      <span
        class="absolute hidden dark:block rounded-full bg-white/25 hibi-float-slow"
        :style="{ top: st.top, left: st.left, width: `${st.s}px`, height: `${st.s}px` }"
      />
    </template>
  </div>
</template>
