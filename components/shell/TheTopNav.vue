<script setup lang="ts">
// Barra superior única. Logo arriba-izquierda = botón "Inicio" (lleva a /inicio).
// Desktop: tira horizontal de iconos de módulos + búsqueda + ajustes + avatar.
// Móvil: logo + título de la página + búsqueda + avatar (los módulos van en la
// bottom nav + sheet "Más").
const { items, settings } = useNav()
const { t } = useI18n()
const route = useRoute()
const { user } = useAuth()
const avatarName = computed(() => user.value?.name || user.value?.email || 'Hibi')

function isActive(to: string) {
  return route.path.startsWith(to)
}

const currentTitle = computed(() => {
  if (route.path.startsWith('/inicio')) return t('nav.today')
  if (route.path.startsWith('/chat')) return 'Chat'
  const all = [...items, settings]
  const match = all.find((i) => isActive(i.to))
  return match ? t(`nav.${match.key}`) : 'Hibi'
})
</script>

<template>
  <header class="relative shrink-0 h-16 flex items-center gap-2 px-3 md:px-4 z-30 bg-card w-full">
    <NuxtLink to="/inicio" class="shrink-0">
      <AppLogo :show-text="false" />
    </NuxtLink>

    <!-- Desktop: tira de iconos de módulos centrada -->
    <nav
      class="hidden md:flex items-center gap-0.5 flex-1 min-w-0 justify-center hibi-no-scrollbar overflow-x-auto"
      :aria-label="t('nav.calendar')"
    >
      <NuxtLink
        v-for="item in items"
        :key="item.key"
        :to="item.to"
        :title="t(`nav.${item.key}`)"
        class="hibi-tn group relative grid place-items-center size-10 rounded-[12px] shrink-0 text-fg-muted hover:bg-muted hover:text-fg transition-colors duration-150"
        :class="{ 'hibi-tn--active': isActive(item.to) }"
      >
        <component
          :is="item.icon"
          class="size-[19px]"
          :stroke-width="isActive(item.to) ? 2.1 : 1.7"
        />
        <span
          class="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-[10px] bg-fg text-card text-[12px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
        >{{ t(`nav.${item.key}`) }}</span>
      </NuxtLink>
    </nav>

    <!-- Móvil: spacer (empuja avatar/ruedita a la derecha) -->
    <div class="md:hidden flex-1 min-w-0" aria-hidden="true" />

    <!-- Móvil: título SIEMPRE centrado sobre el header -->
    <h1 class="md:hidden absolute left-1/2 -translate-x-1/2 max-w-[55%] text-center text-[17px] font-bold text-fg truncate pointer-events-none">
      {{ currentTitle }}
    </h1>

    <!-- Ruedita ajustes — desktop -->
    <NuxtLink
      :to="settings.to"
      :title="t('nav.settings')"
      class="hibi-tn hidden md:grid relative group place-items-center size-10 rounded-[12px] shrink-0 text-fg-muted hover:bg-muted hover:text-fg transition-colors duration-150"
      :class="{ 'hibi-tn--active': isActive(settings.to) }"
    >
      <component
        :is="settings.icon"
        class="size-[19px]"
        :stroke-width="isActive(settings.to) ? 2.1 : 1.7"
      />
      <span
        class="pointer-events-none absolute top-full mt-2 right-0 px-2.5 py-1.5 rounded-[10px] bg-fg text-card text-[12px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
      >{{ t('nav.settings') }}</span>
    </NuxtLink>

    <!-- Ruedita ajustes — móvil, junto al avatar -->
    <NuxtLink
      :to="settings.to"
      :aria-label="t('nav.settings')"
      class="hibi-tn md:hidden grid place-items-center size-9 rounded-full shrink-0 text-fg-muted active:bg-muted transition-colors duration-150"
      :class="{ 'hibi-tn--active': isActive(settings.to) }"
    >
      <component :is="settings.icon" class="size-[20px]" :stroke-width="isActive(settings.to) ? 2.2 : 1.8" />
    </NuxtLink>

    <NuxtLink :to="settings.to" :aria-label="t('nav.settings')" class="shrink-0">
      <AppAvatar :name="avatarName" :src="user?.avatar ?? undefined" :size="36" />
    </NuxtLink>
  </header>
</template>

<style scoped>
/* Blindaje: los iconos del TopNav SIEMPRE deben ser visibles. Prevenimos
   que cualquier transición global de opacity los deje invisibles tras un
   reload rápido / cambio de ruta. */
.hibi-tn {
  opacity: 1 !important;
  animation: none !important;
}
.hibi-tn--active {
  background-color: var(--color-sky-soft);
  color: var(--color-sky-deep);
}
[data-theme="dark"] .hibi-tn--active {
  background-color: color-mix(in srgb, var(--color-sky) 18%, transparent);
  color: var(--color-sky);
}
/* Oculta el scrollbar de la tira de iconos manteniendo el desplazamiento si fuera necesario */
.hibi-no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hibi-no-scrollbar::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>
