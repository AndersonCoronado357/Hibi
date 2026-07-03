<script setup lang="ts">
// Portada (imagen real) recortada con la SILUETA de la nube de Hibi. Si no hay
// imagen, cae a una nube de color. Mantiene la forma de nube pero con su imagen.
const props = withDefaults(defineProps<{ src?: string | null; size?: number; tone?: string }>(), { size: 56, tone: 'text-sky-soft' })
const h = computed(() => Math.round((props.size * 95) / 140))
</script>

<template>
  <div class="shrink-0 relative" :style="{ width: size + 'px', height: h + 'px' }">
    <div v-if="src" class="hibi-cloud-cover w-full h-full bg-center bg-cover" :style="{ backgroundImage: `url('${src}')` }" aria-hidden="true" />
    <HibiCloud v-else :size="size" :class="tone" aria-hidden="true" />
  </div>
</template>

<style scoped>
.hibi-cloud-cover {
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 95'%3E%3Cg fill='black'%3E%3Ccircle cx='30' cy='55' r='30'/%3E%3Ccircle cx='55' cy='30' r='30'/%3E%3Ccircle cx='60' cy='65' r='30'/%3E%3Ccircle cx='95' cy='40' r='25'/%3E%3Ccircle cx='115' cy='60' r='25'/%3E%3Ccircle cx='90' cy='70' r='20'/%3E%3C/g%3E%3C/svg%3E") center / contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 95'%3E%3Cg fill='black'%3E%3Ccircle cx='30' cy='55' r='30'/%3E%3Ccircle cx='55' cy='30' r='30'/%3E%3Ccircle cx='60' cy='65' r='30'/%3E%3Ccircle cx='95' cy='40' r='25'/%3E%3Ccircle cx='115' cy='60' r='25'/%3E%3Ccircle cx='90' cy='70' r='20'/%3E%3C/g%3E%3C/svg%3E") center / contain no-repeat;
}
</style>
