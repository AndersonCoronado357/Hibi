<script setup lang="ts">
import {
  KeyRound, LogOut, Trash2, ImagePlus,
  Palette, Languages, Globe, MessageCircle,
  Bell, Monitor, Sun, AlarmClock,
} from '@lucide/vue'

const { t, locale, setLocale } = useI18n()
const { load: loadSettings, save: saveSettings } = useSettings()
const { dismissed: fabDismissed, setDismissed: setFabDismissed } = useFab()
const fabOptions = [{ value: 'on', label: 'Sí' }, { value: 'off', label: 'No' }]
const langOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]
function onLang(v: string | number) { const l = String(v) as 'es' | 'en'; setLocale(l); saveSettings({ locale: l }) }

const { user, logout } = useAuth()
const profileName = ref('')
const avatarSrc = ref<string | null>(null)
watchEffect(() => {
  if (user.value) {
    if (!profileName.value) profileName.value = user.value.name || ''
    if (!avatarSrc.value && user.value.avatar) avatarSrc.value = user.value.avatar
  }
})

const loggingOut = ref(false)
async function onLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try { await logout() } finally { loggingOut.value = false }
}
const avatarFileRef = ref<HTMLInputElement | null>(null)
function pickAvatar() { avatarFileRef.value?.click() }
function onAvatarChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => { avatarSrc.value = String(reader.result ?? ''); saveSettings({ avatar: avatarSrc.value }) }
  reader.readAsDataURL(f)
}
function removeAvatar() { avatarSrc.value = null; if (avatarFileRef.value) avatarFileRef.value.value = ''; saveSettings({ avatar: null }) }

const notifications = ref<Record<string, boolean>>({ desktop: true, summary: true, reminders: true })

onMounted(async () => {
  const s = await loadSettings()
  if (s) {
    if (s.displayName) profileName.value = s.displayName
    if (s.avatar) avatarSrc.value = s.avatar
    if (s.notifications && typeof s.notifications === 'object') notifications.value = { ...notifications.value, ...s.notifications }
  }
})
watch(profileName, (v) => saveSettings({ displayName: v }))
watch(notifications, (v) => saveSettings({ notifications: { ...v } }), { deep: true })

const timezone = computed(() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'UTC' }
})

const NOTIF_ITEMS = [
  { key: 'desktop',   label: 'Avisos del escritorio', hint: 'Notificaciones nativas del sistema', icon: Monitor,    tone: 'bg-sky-soft text-sky-deep',  activeBg: 'bg-sky-soft', activeText: 'text-sky-deep',    activeHint: 'text-sky-deep/80',   pipColor: 'bg-sky-deep' },
  { key: 'summary',   label: 'Resumen diario',        hint: 'Resumen cada mañana',                icon: Sun,        tone: 'bg-cream text-[#bf8f2e]',    activeBg: 'bg-cream',    activeText: 'text-[#bf8f2e]',   activeHint: 'text-[#bf8f2e]/80',  pipColor: 'bg-[#bf8f2e]' },
  { key: 'reminders', label: 'Recordatorios',         hint: 'Avisos de tareas y eventos',         icon: AlarmClock, tone: 'bg-mint text-[#34936a]',     activeBg: 'bg-mint',     activeText: 'text-[#34936a]',   activeHint: 'text-[#34936a]/80',  pipColor: 'bg-[#34936a]' },
] as const
</script>

<template>
  <div class="h-full w-full flex flex-col md:flex-row gap-4 px-4 md:px-7 py-4 md:py-5 relative overflow-hidden md:overflow-hidden overflow-y-auto scroll-area">
    <!-- Decoración de fondo SUTIL solo en desktop, en esquinas extremas -->
    <HibiCloud :size="180" float :duration="7" class="hidden md:block absolute -top-10 -right-10 text-sky-soft opacity-20 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="120" float :duration="9" :delay="1.5" class="hidden md:block absolute -bottom-8 -left-8 text-pink-soft opacity-20 pointer-events-none" aria-hidden="true" />

    <!-- ════════════════════════════════════════════════════════════
         COLUMNA IZQUIERDA — TARJETA DE PRESENTACIÓN VERTICAL
         ════════════════════════════════════════════════════════════ -->
    <AppCard class="relative z-10 shrink-0 w-full md:w-[400px] !p-0 flex flex-col overflow-hidden">
      <!-- Banner pastel arriba — solo nubes en esquinas, sin sparkles invasivos -->
      <div class="relative h-[130px] md:h-[190px] bg-sky-soft shrink-0 overflow-hidden">
        <HibiCloud :size="80" float :duration="6" class="absolute top-3 left-4 text-card opacity-85 md:size-[100px]" aria-hidden="true" />
        <HibiCloud :size="52"  float :duration="8" :delay="0.7" class="absolute bottom-2 right-4 text-card opacity-65 md:size-[64px]" aria-hidden="true" />
      </div>

      <!-- Avatar XXL superpuesto -->
      <div class="relative -mt-20 md:-mt-28 px-4 md:px-6 shrink-0 flex flex-col items-center">
        <div class="relative">
          <div class="rounded-full p-1.5 bg-card">
            <AppAvatar :name="profileName" :src="avatarSrc ?? undefined" :size="200" />
          </div>
          <!-- Botón cambiar foto: blanco con icono ImagePlus en sky-deep, anillo sky-soft -->
          <button type="button"
            class="absolute bottom-3 right-3 grid place-items-center size-14 rounded-full bg-card text-sky-deep hover:bg-sky-soft transition-[background-color,transform] hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
            style="box-shadow: inset 0 0 0 3px var(--bg-base);"
            aria-label="Cambiar foto" @click="pickAvatar">
            <ImagePlus class="size-[22px]" :stroke-width="2" />
          </button>
          <!-- Botón quitar foto (× en esquina opuesta), solo si hay foto subida -->
          <button v-if="avatarSrc" type="button"
            class="absolute top-2 right-2 grid place-items-center size-9 rounded-full bg-card text-pink-deep hover:bg-pink-soft transition-[background-color,transform] hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-pink-deep"
            style="box-shadow: inset 0 0 0 2.5px var(--bg-base);"
            aria-label="Quitar foto" @click="removeAvatar">
            <Trash2 class="size-[14px]" :stroke-width="2.2" />
          </button>
          <input ref="avatarFileRef" type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
        </div>
        <input v-model="profileName" type="text" placeholder="Tu nombre"
          class="mt-4 text-[22px] font-extrabold text-fg leading-tight bg-transparent outline-none w-full text-center px-2 py-1 rounded-[10px]" />
        <p class="text-[11.5px] font-bold text-fg-muted uppercase tracking-[0.16em] mt-0.5">Mi cuenta</p>
      </div>

      <!-- Espaciador flexible -->
      <div class="flex-1 min-h-0" />

      <!-- ACCIONES GRANDES abajo: Contraseña + Cerrar sesión, UNA ENCIMA DE LA OTRA -->
      <div class="shrink-0 p-4 flex flex-col gap-3">
        <button type="button" class="w-full flex items-center gap-4 px-4 py-4 rounded-[16px] bg-cream hover:bg-yellow transition-[background-color] outline-none focus-visible:ring-2 focus-visible:ring-[#bf8f2e] text-left">
          <HibiCloudIcon :size="68" :icon="KeyRound" :icon-size="24" cloud-color="text-cream" icon-color="text-[#bf8f2e]" :icon-stroke="1.9" class="shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-[15px] font-extrabold text-[#bf8f2e] leading-tight">Cambiar contraseña</p>
            <p class="text-[12px] font-bold text-[#bf8f2e]/80 mt-0.5">Última vez: nunca</p>
          </div>
        </button>

        <button type="button" :disabled="loggingOut" class="w-full flex items-center gap-4 px-4 py-4 rounded-[16px] bg-pink-soft hover:bg-pink transition-[background-color] outline-none focus-visible:ring-2 focus-visible:ring-pink-deep text-left disabled:opacity-60" @click="onLogout">
          <HibiCloudIcon :size="68" :icon="LogOut" :icon-size="24" cloud-color="text-pink-soft" icon-color="text-pink-deep" :icon-stroke="1.9" class="shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-[15px] font-extrabold text-pink-deep leading-tight">Cerrar sesión</p>
            <p class="text-[12px] font-bold text-pink-deep/80 mt-0.5">{{ loggingOut ? 'Saliendo…' : 'En este dispositivo' }}</p>
          </div>
        </button>
      </div>
    </AppCard>

    <!-- ════════════════════════════════════════════════════════════
         COLUMNA DERECHA — PANEL DE PREFERENCIAS Y NOTIFICACIONES
         ════════════════════════════════════════════════════════════ -->
    <div class="relative z-10 w-full md:flex-1 min-w-0 md:min-h-0 flex flex-col gap-4 pb-2 md:pb-0">
      <!-- Encabezado del panel -->
      <header class="shrink-0 flex items-end justify-between">
        <div>
          <h1 class="text-[26px] font-extrabold text-fg leading-tight">{{ t('nav.settings') }}</h1>
          <p class="text-[13px] text-fg-muted mt-0.5">Personaliza tu experiencia en Hibi</p>
        </div>
      </header>

      <!-- Bloque preferencias — fila horizontal de 3 -->
      <section class="shrink-0">
        <div class="flex items-center gap-2 mb-3 px-1">
          <span class="h-2 w-2 rounded-full bg-sky-deep" />
          <h2 class="text-[12.5px] font-extrabold text-fg-muted uppercase tracking-[0.12em]">Apariencia y región</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AppCard class="!p-5 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <HibiCloudIcon :size="60" :icon="Palette" :icon-size="22" cloud-color="text-sky-soft" icon-color="text-sky-deep" :icon-stroke="1.8" class="shrink-0" />
              <div class="min-w-0">
                <h3 class="text-[14.5px] font-extrabold text-fg leading-tight">{{ t('theme.label') }}</h3>
                <p class="text-[12px] text-fg-muted truncate">Claro u oscuro</p>
              </div>
            </div>
            <ThemeToggle />
          </AppCard>

          <AppCard class="!p-5 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <HibiCloudIcon :size="60" :icon="MessageCircle" :icon-size="22" cloud-color="text-lavender" icon-color="text-[#7a63c0]" :icon-stroke="1.8" class="shrink-0" />
              <div class="min-w-0">
                <h3 class="text-[14.5px] font-extrabold text-fg leading-tight">Nube de chat</h3>
                <p class="text-[12px] text-fg-muted truncate">{{ fabDismissed ? 'Oculta' : 'Visible' }}</p>
              </div>
            </div>
            <AppSegmented :model-value="fabDismissed ? 'off' : 'on'" :options="fabOptions" toggle @update:model-value="(v) => setFabDismissed(String(v) === 'off')" />
          </AppCard>

          <AppCard class="!p-5 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <HibiCloudIcon :size="60" :icon="Languages" :icon-size="22" cloud-color="text-pink-soft" icon-color="text-pink-deep" :icon-stroke="1.8" class="shrink-0" />
              <div class="min-w-0">
                <h3 class="text-[14.5px] font-extrabold text-fg leading-tight">Idioma</h3>
                <p class="text-[12px] text-fg-muted truncate">{{ langOptions.find(o => o.value === locale)?.label }}</p>
              </div>
            </div>
            <AppSegmented :model-value="locale" :options="langOptions" toggle @update:model-value="onLang" />
          </AppCard>

          <AppCard class="!p-5 flex items-center gap-3">
            <HibiCloudIcon :size="60" :icon="Globe" :icon-size="22" cloud-color="text-mint" icon-color="text-[#34936a]" :icon-stroke="1.8" class="shrink-0" />
            <div class="flex-1 min-w-0">
              <h3 class="text-[14.5px] font-extrabold text-fg leading-tight">Zona horaria</h3>
              <p class="text-[12px] text-fg-muted truncate" :title="timezone">{{ timezone }}</p>
              <p class="text-[10.5px] text-fg-subtle">Detectada automáticamente</p>
            </div>
          </AppCard>
        </div>
      </section>

      <!-- Bloque notificaciones — ocupa el resto del alto (en móvil, natural) -->
      <section class="shrink-0 md:flex-1 md:min-h-0 flex flex-col">
        <div class="flex items-center gap-2 mb-3 px-1 shrink-0">
          <span class="h-2 w-2 rounded-full bg-peach" />
          <h2 class="text-[12.5px] font-extrabold text-fg-muted uppercase tracking-[0.12em]">Notificaciones</h2>
        </div>
        <AppCard class="md:flex-1 md:min-h-0 !p-5 flex flex-col">
          <header class="flex items-center gap-3 mb-4 shrink-0">
            <HibiCloudIcon :size="60" :icon="Bell" :icon-size="22" cloud-color="text-peach" icon-color="text-[#c5733f]" :icon-stroke="1.9" class="shrink-0" />
            <div>
              <h3 class="text-[16px] font-extrabold text-fg leading-tight">Qué quieres recibir</h3>
              <p class="text-[12.5px] text-fg-muted">Toca una tarjeta para activarla o silenciarla</p>
            </div>
          </header>
          <div class="md:flex-1 md:min-h-0 grid grid-cols-1 md:grid-cols-3 gap-3">
            <button v-for="opt in NOTIF_ITEMS" :key="opt.key" type="button"
              :aria-pressed="notifications[opt.key]"
              class="relative flex flex-col items-center justify-center text-center p-5 rounded-[18px] transition-[background-color,opacity] outline-none focus-visible:ring-2 focus-visible:ring-sky-deep overflow-hidden"
              :class="notifications[opt.key] ? opt.activeBg : 'bg-muted hover:bg-inset opacity-55'"
              @click="notifications[opt.key] = !notifications[opt.key]">
              <!-- Pip de estado, arriba derecha — del color propio de la opción -->
              <span class="absolute top-3 right-3 size-2.5 rounded-full" :class="notifications[opt.key] ? opt.pipColor : 'bg-fg-subtle/50'" aria-hidden="true" />
              <!-- Nubecita decorativa al fondo -->
              <HibiCloud :size="70" class="absolute -bottom-3 -left-3 opacity-25" :class="notifications[opt.key] ? 'text-card' : 'text-fg-subtle/30'" aria-hidden="true" />

              <!-- Icono dentro de una NUBE grande centrada (estética cinnamoroll) -->
              <HibiCloudIcon
                :size="100"
                :icon="opt.icon"
                :icon-size="38"
                :cloud-color="notifications[opt.key] ? 'text-card' : opt.tone.split(' ')[0]"
                :icon-color="notifications[opt.key] ? opt.activeText : opt.tone.split(' ')[1]"
                :icon-stroke="1.7"
                class="relative shrink-0" />
              <p class="relative mt-4 text-[15.5px] font-extrabold leading-tight" :class="notifications[opt.key] ? opt.activeText : 'text-fg'">{{ opt.label }}</p>
              <p class="relative text-[12px] mt-1 leading-snug max-w-[180px]" :class="notifications[opt.key] ? opt.activeHint : 'text-fg-muted'">{{ opt.hint }}</p>
            </button>
          </div>
        </AppCard>
      </section>
    </div>
  </div>
</template>
