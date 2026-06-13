<script setup lang="ts">
import { Palette, Languages, Settings as Cog, User, Bell, Download, LogOut } from '@lucide/vue'

const { t, locale, setLocale } = useI18n()
const langOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]
function onLang(v: string | number) { setLocale(String(v) as 'es' | 'en') }
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <AppCard class="shrink-0 !p-3 md:!p-4 flex items-center gap-2.5">
      <span class="grid place-items-center size-10 rounded-[13px] bg-muted text-fg-muted" aria-hidden="true"><Cog class="size-5" :stroke-width="1.9" /></span>
      <div>
        <h1 class="text-[20px] md:text-[22px] font-extrabold text-fg leading-tight">{{ t('nav.settings') }}</h1>
        <p class="text-[12.5px] text-fg-muted leading-tight">Tu cuenta, tema, idioma y datos</p>
      </div>
    </AppCard>

    <div class="flex-1 min-h-0 overflow-y-auto scroll-area">
      <div class="max-w-[680px] mx-auto flex flex-col gap-3">
        <AppCard class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center size-11 rounded-[14px] bg-sky-soft text-sky-deep" aria-hidden="true"><User class="size-5" :stroke-width="1.8" /></span>
            <div>
              <h3 class="text-[15px] font-bold text-fg">Perfil</h3>
              <p class="text-[13px] text-fg-muted">Tu nombre, correo y foto</p>
            </div>
          </div>
          <AppButton variant="secondary" size="sm">Editar</AppButton>
        </AppCard>

        <AppCard class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center size-11 rounded-[14px] bg-sky-soft text-sky-deep" aria-hidden="true"><Palette class="size-5" :stroke-width="1.8" /></span>
            <div>
              <h3 class="text-[15px] font-bold text-fg">{{ t('theme.label') }}</h3>
              <p class="text-[13px] text-fg-muted">Claro u oscuro</p>
            </div>
          </div>
          <ThemeToggle />
        </AppCard>

        <AppCard class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center size-11 rounded-[14px] bg-pink-soft text-pink-deep" aria-hidden="true"><Languages class="size-5" :stroke-width="1.8" /></span>
            <div>
              <h3 class="text-[15px] font-bold text-fg">Idioma</h3>
              <p class="text-[13px] text-fg-muted">Español o English</p>
            </div>
          </div>
          <AppSegmented :model-value="locale" :options="langOptions" @update:model-value="onLang" />
        </AppCard>

        <AppCard class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center size-11 rounded-[14px] bg-peach text-[#c5733f]" aria-hidden="true"><Bell class="size-5" :stroke-width="1.8" /></span>
            <div>
              <h3 class="text-[15px] font-bold text-fg">Notificaciones</h3>
              <p class="text-[13px] text-fg-muted">Avisos del navegador y sonidos</p>
            </div>
          </div>
          <AppButton variant="secondary" size="sm">Permitir</AppButton>
        </AppCard>

        <AppCard class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center size-11 rounded-[14px] bg-mint text-[#34936a]" aria-hidden="true"><Download class="size-5" :stroke-width="1.8" /></span>
            <div>
              <h3 class="text-[15px] font-bold text-fg">Exportar datos</h3>
              <p class="text-[13px] text-fg-muted">Descarga todo tu Hibi en JSON</p>
            </div>
          </div>
          <AppButton variant="secondary" size="sm">Exportar</AppButton>
        </AppCard>

        <AppCard class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center size-11 rounded-[14px] bg-pink-soft text-pink-deep" aria-hidden="true"><LogOut class="size-5" :stroke-width="1.8" /></span>
            <div>
              <h3 class="text-[15px] font-bold text-fg">Cerrar sesión</h3>
              <p class="text-[13px] text-fg-muted">En este dispositivo</p>
            </div>
          </div>
          <AppButton variant="danger" size="sm">Salir</AppButton>
        </AppCard>
      </div>
    </div>
  </div>
</template>
