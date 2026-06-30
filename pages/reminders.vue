<script setup lang="ts">
import { Plus, BellRing, AlarmClock, Bell, Check, Clock, Layers, Volume2, FileText, Trash2 } from '@lucide/vue'

const { t, locale } = useI18n()

useHead({ title: t('reminders.head.title') })

const { reminders, createReminder, removeReminder, toggleDone, isLoading } = useReminders()

// Claves de grupo ESTABLES (se usan en lógica); las etiquetas se traducen aparte.
type Group = 'today' | 'tomorrow' | 'week' | 'later'
const today = new Date()
const iso = (d: Date) => d.toISOString().slice(0, 10)
const dPlus = (n: number) => { const x = new Date(today); x.setDate(x.getDate() + n); return iso(x) }

// El grupo se DERIVA de remindDate (no se guarda): Hoy / Mañana / Esta semana / Más adelante.
function groupOf(remindDate: string): Group {
  const t0 = iso(today)
  if (remindDate <= t0) return 'today'
  if (remindDate === dPlus(1)) return 'tomorrow'
  if (remindDate <= dPlus(7)) return 'week'
  return 'later'
}

// Etiquetas visibles por clave de grupo — reactivas al idioma.
const groupLabels = computed<Record<Group, string>>(() => ({
  today: t('common.today'),
  tomorrow: t('common.tomorrow'),
  week: t('reminders.groups.week'),
  later: t('reminders.groups.later'),
}))

function fmtWhen(r: Reminder) {
  try {
    const d = new Date(r.remindDate + 'T00:00:00')
    const dateStr = d.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    return r.time ? `${dateStr} · ${r.time}` : dateStr
  } catch { return r.remindDate + (r.time ? ' ' + r.time : '') }
}

const groups: Group[] = ['today', 'tomorrow', 'week', 'later']
function inGroup(g: Group) {
  return reminders.value.filter(r => groupOf(r.remindDate) === g)
}
// Solo mostramos las cabeceras de grupo que tengan al menos un recordatorio.
const activeGroups = computed(() => groups.filter(g => inGroup(g).length > 0))

const view = ref<'list' | 'create'>('list')
const newTitle = ref('')
const newDate = ref(iso(today))
const newTime = ref('09:00')
const newAlarm = ref(false)
const newPre = ref('')
const newNotes = ref('')
const saving = ref(false)
// value = clave estable guardada; label = texto visible reactivo.
const PRE_OPTS = computed(() => [
  { value: '', label: t('reminders.pre.exact') },
  { value: '5 min antes', label: t('reminders.pre.min5') },
  { value: '10 min antes', label: t('reminders.pre.min10') },
  { value: '15 min antes', label: t('reminders.pre.min15') },
  { value: '30 min antes', label: t('reminders.pre.min30') },
  { value: '1 hora antes', label: t('reminders.pre.hour1') },
  { value: '1 día antes', label: t('reminders.pre.day1') },
])
function openCreate() {
  newTitle.value = ''; newDate.value = iso(today); newTime.value = '09:00'
  newAlarm.value = false; newPre.value = ''; newNotes.value = ''
  view.value = 'create'
}
function cancelCreate() { view.value = 'list' }
async function saveReminder() {
  const title = newTitle.value.trim(); if (!title || saving.value) return
  saving.value = true
  try {
    await createReminder({
      title,
      remindDate: newDate.value,
      time: newTime.value || null,
      alarm: newAlarm.value,
      pre: newPre.value || null,
      notes: newNotes.value || null,
    })
    view.value = 'list'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <!-- VISTA DE CREACIÓN: clásica -->
  <AppCreateView v-if="view === 'create'"
    :title="t('reminders.create.title')"
    :subtitle="t('reminders.create.subtitle')"
    :disabled="!newTitle.trim() || saving"
    @close="cancelCreate" @save="saveReminder">
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('reminders.create.titleLabel') }}</label>
      <input v-model="newTitle" type="text" :placeholder="t('reminders.create.titlePlaceholder')" autofocus
        class="w-full h-14 rounded-[14px] bg-card px-4 text-[18px] font-semibold text-fg outline-none placeholder:text-fg-subtle" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('reminders.create.dateLabel') }}</label>
        <AppDate v-model="newDate" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('reminders.create.timeLabel') }}</label>
        <AppTime v-model="newTime" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('reminders.create.alarmLabel') }}</label>
        <div class="flex items-center gap-2.5 h-12 px-3 rounded-[12px] bg-card">
          <AppCheck v-model="newAlarm" :label="t('reminders.create.alarmLabel')" />
          <span class="text-[13.5px] font-semibold text-fg cursor-pointer" @click="newAlarm = !newAlarm">{{ newAlarm ? t('reminders.create.alarmOn') : t('reminders.create.alarmOff') }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('reminders.create.preLabel') }}</label>
      <div class="flex flex-wrap gap-1.5">
        <button v-for="o in PRE_OPTS" :key="o.value" type="button"
          class="hibi-chip bg-muted text-fg" :class="newPre === o.value ? 'is-active' : ''"
          @click="newPre = o.value">{{ o.label }}</button>
      </div>
    </div>

    <div class="flex flex-col gap-2 flex-1 min-h-[160px]">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('reminders.create.notesLabel') }}</label>
      <textarea v-model="newNotes" :placeholder="t('reminders.create.notesPlaceholder')"
        class="w-full flex-1 min-h-[160px] rounded-[14px] bg-card px-4 py-3 text-[14.5px] text-fg outline-none resize-none"></textarea>
    </div>
  </AppCreateView>

  <!-- VISTA NORMAL -->
  <div v-else class="h-full w-full flex flex-col gap-3 px-4 md:px-7 py-5 overflow-hidden relative">
    <!-- Decoración cute -->
    <HibiCloud :size="150" float :duration="8" class="hidden md:block absolute -top-6 -right-8 text-mint opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90"  float :duration="10" :delay="1.2" class="hidden md:block absolute bottom-6 -left-6 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[16%] left-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute bottom-[28%] right-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute top-[36%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <!-- Toolbar -->
    <div class="relative z-10">
      <PageHero :icon="BellRing" tone="peach" :title="t('reminders.title')" :subtitle="t('reminders.subtitle', { count: reminders.length })">
        <template #actions>
          <AppButton variant="primary" size="sm" class="w-full md:w-auto" @click="openCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>{{ t('reminders.new') }}</AppButton>
        </template>
      </PageHero>
    </div>

    <!-- Timeline full ancho -->
    <AppCard class="relative z-10 flex-1 min-h-0 flex flex-col" :padded="false">
      <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-5 md:px-8 py-5">
        <!-- Cargando: pulso suave con el mismo layout del timeline -->
        <div v-if="isLoading && !reminders.length" class="w-full flex flex-col gap-3">
          <div v-for="n in 5" :key="n" class="grid grid-cols-[72px_1fr] gap-3 items-center">
            <div class="size-[72px] rounded-full bg-muted/70 animate-pulse mx-auto" />
            <div class="h-[64px] rounded-[14px] bg-muted/60 animate-pulse" />
          </div>
        </div>

        <!-- Vacío: mismo lenguaje visual cute -->
        <div v-else-if="!reminders.length" class="h-full min-h-[280px] flex flex-col items-center justify-center text-center gap-3 py-10">
          <HibiCloudIcon :size="96" :icon="Bell" :icon-size="34" cloud-color="text-sky-soft" icon-color="text-sky-deep" :icon-stroke="1.7" />
          <div>
            <p class="text-[15px] font-extrabold text-fg">{{ t('reminders.empty.title') }}</p>
            <p class="text-[13px] text-fg-muted mt-0.5">{{ t('reminders.empty.subtitle') }}</p>
          </div>
        </div>

        <div v-else class="w-full">
          <div v-for="(g, gi) in activeGroups" :key="g" :class="gi > 0 ? 'mt-7' : ''">
            <div class="flex items-center justify-between mb-3 px-1">
              <h2 class="text-[15px] font-extrabold text-fg">{{ groupLabels[g] }}</h2>
              <span class="text-[11.5px] text-fg-muted font-bold">{{ inGroup(g).length }}</span>
            </div>
            <!-- Grid: col 1 = 48px (línea + bolita centradas), col 2 = 1fr (contenido) -->
            <ul class="hibi-anim-float-down flex flex-col gap-3">
              <li v-for="r in inGroup(g)" :key="r.id"
                class="group/rem grid grid-cols-[72px_1fr] gap-3 items-center">
                <!-- Columna del marcador: la nube TAMBIÉN alterna hecho al tocarla -->
                <button type="button" class="relative flex items-center justify-center cursor-pointer"
                  :aria-label="r.done ? t('reminders.row.markPending') : t('reminders.row.markDone')"
                  @click="toggleDone(r)">
                  <HibiCloudIcon
                    :size="72"
                    :icon="r.done ? Check : (r.alarm ? AlarmClock : Bell)"
                    :icon-size="20"
                    :cloud-color="r.done ? 'text-mint' : (r.alarm ? 'text-pink-soft' : 'text-sky-soft')"
                    :icon-color="r.done ? 'text-[#34936a]' : (r.alarm ? 'text-pink-deep' : 'text-sky-deep')"
                    :icon-stroke="r.done ? 2.6 : 2" />
                </button>
                <!-- Tarjeta — click en cualquier punto = toggle hecho -->
                <button type="button"
                  class="min-w-0 bg-muted rounded-[14px] p-3.5 md:p-4 flex items-center justify-between gap-3 text-left transition-[background-color,opacity] hover:bg-inset w-full"
                  :class="r.done ? 'opacity-60' : ''"
                  @click="toggleDone(r)">
                  <div class="min-w-0 flex-1">
                    <p class="text-[14.5px] font-bold text-fg break-words" :class="r.done ? 'line-through' : ''">{{ r.title }}</p>
                    <p class="text-[12.5px] text-fg-muted mt-0.5 break-words" :class="r.done ? 'line-through' : ''">
                      {{ fmtWhen(r) }}<span v-if="r.pre">, <span class="font-semibold">{{ r.pre }}</span></span>
                    </p>
                  </div>
                  <span class="shrink-0 flex items-center gap-1.5">
                    <span class="relative inline-block" :style="{ width: '44px', height: '30px' }">
                      <Transition name="hibi-check">
                        <HibiCloudIcon
                          :key="r.done ? 'on' : 'off'"
                          :size="44"
                          :icon="Check"
                          :icon-size="16"
                          :cloud-color="r.done ? 'text-mint' : 'text-muted'"
                          :icon-color="r.done ? 'text-[#34936a]' : 'text-transparent'"
                          :icon-stroke="2.3"
                          class="absolute inset-0" />
                      </Transition>
                    </span>
                    <!-- Eliminar: discreto, aparece al pasar el cursor -->
                    <span
                      role="button"
                      tabindex="0"
                      class="grid place-items-center size-8 rounded-[10px] text-fg-subtle hover:text-pink-deep hover:bg-pink-soft transition-[background-color,color,opacity] opacity-0 group-hover/rem:opacity-100 focus-visible:opacity-100 outline-none"
                      :aria-label="t('reminders.row.delete')"
                      @click.stop="removeReminder(r.id)"
                      @keydown.enter.stop.prevent="removeReminder(r.id)"
                      @keydown.space.stop.prevent="removeReminder(r.id)">
                      <Trash2 class="size-[15px]" :stroke-width="2.1" aria-hidden="true" />
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
