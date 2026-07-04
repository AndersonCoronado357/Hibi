<script setup lang="ts">
// Splash de marca al abrir la PWA instalada: degradado cielo + la nube (mascota)
// + "Hibi / 日々". SOLO se muestra en modo instalado (CSS display-mode:
// standalone); en el navegador normal no aparece. Se desvanece cuando la app
// ya está lista (tiempo mínimo para que se lea como splash, no como parpadeo).
const visible = ref(true) // controla el fundido de salida
const gone = ref(false)   // se quita del DOM tras el fundido

onMounted(() => {
  setTimeout(() => { visible.value = false }, 1150)
  setTimeout(() => { gone.value = true }, 1650)
})
</script>

<template>
  <div v-if="!gone" data-theme="light" class="hibi-splash" :class="{ 'is-hiding': !visible }" aria-hidden="true">
    <div class="hibi-splash-inner">
      <MascotCloud :size="150" class="text-white" />
      <h1 class="mt-6 text-[40px] font-extrabold text-[#1c4258] tracking-tight leading-none">Hibi</h1>
      <p class="mt-1.5 text-[#14202b] font-extrabold tracking-[0.32em] text-sm">日々</p>
      <div class="hibi-splash-dots mt-7"><span /><span /><span /></div>
    </div>
  </div>
</template>

<style scoped>
.hibi-splash {
  display: none;
  position: fixed; inset: 0;
  z-index: 200;
  flex-direction: column;
  align-items: center; justify-content: center;
  background: linear-gradient(to bottom, #a6d6f0 0%, #a6d6f0 30%, #ffffff 64%, #ffffff 100%);
  opacity: 1;
  transition: opacity 0.5s ease;
}
/* Solo en la app instalada (standalone / pantalla completa), nunca en el navegador */
@media (display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui) {
  .hibi-splash { display: flex; }
}
.hibi-splash.is-hiding { opacity: 0; pointer-events: none; }

.hibi-splash-inner {
  display: flex; flex-direction: column; align-items: center;
  animation: hibi-splash-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes hibi-splash-in {
  0% { opacity: 0; transform: translateY(10px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.hibi-splash-dots { display: flex; gap: 7px; }
.hibi-splash-dots span {
  width: 8px; height: 8px; border-radius: 9999px; background: #5aa6d2;
  animation: hibi-splash-bounce 1s ease-in-out infinite;
}
.hibi-splash-dots span:nth-child(2) { animation-delay: 0.15s; }
.hibi-splash-dots span:nth-child(3) { animation-delay: 0.3s; }
@keyframes hibi-splash-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-6px); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .hibi-splash-inner { animation: none; }
  .hibi-splash-dots span { animation: none; opacity: 0.85; }
}
</style>
