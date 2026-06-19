<script setup lang="ts">
import { CalendarClock, ListTodo, BellRing, Flame, Smile, Sparkles, Plus, Cloud as CloudIcon } from '@lucide/vue'

const { t, locale } = useI18n()
const { greeting, now } = useGreeting()
const quick = ref('')

const dateLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(now.value),
)

interface Widget { key: string; icon: typeof CalendarClock; title: string; badge: string }
const widgets = computed<Widget[]>(() => [
  { key: 'todayEvents', icon: CalendarClock, title: t('today.widgets.todayEvents'), badge: 'bg-sky-soft text-sky-deep' },
  { key: 'todayTasks', icon: ListTodo, title: t('today.widgets.todayTasks'), badge: 'bg-mint text-[#34936a]' },
  { key: 'reminders', icon: BellRing, title: t('today.widgets.reminders'), badge: 'bg-peach text-[#c5733f]' },
  { key: 'habits', icon: Flame, title: t('today.widgets.habits'), badge: 'bg-pink-soft text-pink-deep' },
  { key: 'mood', icon: Smile, title: t('today.widgets.mood'), badge: 'bg-lavender text-[#7a63c0]' },
  { key: 'streak', icon: Sparkles, title: t('today.widgets.streak'), badge: 'bg-cream text-[#bf8f2e]' },
])
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden relative">
    <!-- Decoración cinnamoroll -->
    <HibiCloud :size="240" float :duration="8" class="hidden md:block absolute -top-10 -right-10 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="170" float :duration="10" :delay="1.4" class="hidden md:block absolute bottom-16 -left-10 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="120" float :duration="12" :delay="0.6" class="hidden md:block absolute top-1/2 right-1/4 text-lavender opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90" float :duration="14" :delay="2.5" class="hidden md:block absolute top-[20%] left-1/3 text-mint opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="28" twinkle :duration="2.4" class="hidden md:block absolute top-[18%] left-[12%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="24" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute top-[8%] right-[36%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="20" twinkle :duration="2.6" :delay="1.6" class="hidden md:block absolute bottom-[28%] left-[28%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="22" twinkle :duration="2.8" :delay="2.2" class="hidden md:block absolute top-[58%] right-[12%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="24" beat :duration="2.4" class="hidden md:block absolute bottom-[18%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="20" beat :duration="2.8" :delay="0.9" class="hidden md:block absolute top-[68%] left-[16%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <div class="relative z-10 flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col">
      <!-- ────────────────────────────────────────────────────────────
           CAPTURA RÁPIDA — MÓVIL
           Sticky en la parte de arriba, full ancho.
           ──────────────────────────────────────────────────────────── -->
      <section class="md:hidden sticky top-0 z-30 px-4 pt-4 pb-3 bg-base/95 backdrop-blur-sm">
        <div class="relative w-full">
          <label for="quick-capture-mobile" class="sr-only">{{ t('today.quickCapture') }}</label>
          <input
            id="quick-capture-mobile" v-model="quick"
            :placeholder="t('today.quickCapture')"
            class="w-full h-12 rounded-full bg-card focus:bg-inset pl-5 pr-14 text-[15px] text-fg outline-none transition-[background-color] duration-200 ease-soft shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-ellipsis-none"
          />
          <button
            type="button" :aria-label="t('common.add')"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-10 rounded-full bg-sky text-[#1f4661] hover:brightness-[0.96] transition-[filter] duration-200"
          ><Plus class="size-5" :stroke-width="2.4" aria-hidden="true" /></button>
        </div>
      </section>

      <!-- HERO: saludo + (captura rápida solo en desktop) -->
      <section class="shrink-0 px-4 md:px-7 pt-2 md:pt-6 pb-3">
        <AppCard class="relative overflow-hidden bg-sky-soft !p-6 md:!p-7">
          <div class="relative z-10 flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <p class="text-sky-deep text-[12.5px] font-bold capitalize">{{ dateLabel }}</p>
              <h2 class="text-[clamp(24px,3vw,32px)] font-extrabold text-fg mt-1 leading-tight">{{ greeting }}</h2>
              <p class="text-fg-muted mt-1 text-[14px] md:text-[15px] max-w-[36ch]">{{ t('today.subtitle') }}</p>
              <!-- Captura rápida desktop (en móvil la subimos al sticky) -->
              <div class="mt-5 relative max-w-2xl hidden md:block">
                <label for="quick-capture" class="sr-only">{{ t('today.quickCapture') }}</label>
                <input
                  id="quick-capture" v-model="quick"
                  :placeholder="t('today.quickCapture')"
                  class="w-full h-12 rounded-full bg-card focus:bg-inset pl-5 pr-14 text-[15px] text-fg outline-none transition-[background-color] duration-200 ease-soft"
                />
                <button
                  type="button" :aria-label="t('common.add')"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-10 rounded-full bg-sky text-[#1f4661] hover:brightness-[0.96] transition-[filter] duration-200"
                ><Plus class="size-5" :stroke-width="2.4" aria-hidden="true" /></button>
              </div>
            </div>
            <MascotCloud :size="116" class="hidden md:block shrink-0 text-white" />
          </div>
        </AppCard>
      </section>

      <!-- WIDGETS: grid que llena -->
      <section class="md:flex-1 md:min-h-0 px-4 md:px-7 pb-6">
        <div class="hibi-anim-pop grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr md:h-full">
          <AppCard
            v-for="(w, i) in widgets" :key="w.key"
            v-motion
            :initial="{ opacity: 0, y: 10 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: i * 55, duration: 320 } }"
            class="flex flex-col min-h-[170px] relative overflow-hidden"
          >
            <HibiCloud :size="60" class="hidden md:block absolute -top-2 -right-2 text-card opacity-15 pointer-events-none z-40" aria-hidden="true" />
            <div class="flex items-center gap-2.5 relative z-10">
              <HibiCloudIcon :size="54" :icon="w.icon" :icon-size="19" :cloud-color="w.badge.split(' ')[0]" :icon-color="w.badge.split(' ')[1]" :icon-stroke="1.9" class="shrink-0" />
              <h3 class="text-[15px] font-bold text-fg">{{ w.title }}</h3>
            </div>
            <div class="flex-1 flex flex-col items-center justify-center gap-2 text-fg-subtle relative z-10">
              <HibiCloud :size="52" class="text-sky-soft opacity-25" face aria-hidden="true" />
              <p class="text-[13px] font-medium">{{ t('common.empty') }}</p>
            </div>
          </AppCard>
        </div>
      </section>
    </div>
  </div>
</template>
