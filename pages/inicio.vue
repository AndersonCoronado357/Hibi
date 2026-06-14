<script setup lang="ts">
import { CalendarClock, ListTodo, BellRing, Flame, Smile, Sparkles, Plus, Cloud } from '@lucide/vue'

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
  { key: 'streak', icon: Sparkles, title: t('today.widgets.streak'), badge: 'bg-[#fff1cf] text-[#bf8f2e]' },
])
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 min-h-0 overflow-y-auto md:overflow-hidden md:flex md:flex-col scroll-area">
      <!-- HERO en card: saludo + captura -->
      <section class="shrink-0 px-4 md:px-7 pt-5 md:pt-6 pb-3">
        <AppCard class="relative overflow-hidden bg-sky-soft !p-6 md:!p-7">
          <div class="relative z-10 flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <p class="text-sky-deep text-[12.5px] font-bold capitalize">{{ dateLabel }}</p>
              <h2 class="text-[clamp(24px,3vw,32px)] font-extrabold text-fg mt-1 leading-tight">{{ greeting }}</h2>
              <p class="text-fg-muted mt-1 text-[14px] md:text-[15px] max-w-[36ch]">{{ t('today.subtitle') }}</p>
              <div class="mt-5 relative max-w-2xl">
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
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr md:h-full">
          <AppCard
            v-for="(w, i) in widgets" :key="w.key"
            v-motion
            :initial="{ opacity: 0, y: 10 }"
            :enter="{ opacity: 1, y: 0, transition: { delay: i * 55, duration: 320 } }"
            class="flex flex-col min-h-[170px]"
          >
            <div class="flex items-center gap-2.5">
              <span class="grid place-items-center size-10 rounded-[13px]" :class="w.badge" aria-hidden="true">
                <component :is="w.icon" class="size-[19px]" :stroke-width="1.9" />
              </span>
              <h3 class="text-[15px] font-bold text-fg">{{ w.title }}</h3>
            </div>
            <div class="flex-1 flex flex-col items-center justify-center gap-2 text-fg-subtle">
              <Cloud class="size-7 opacity-60" :stroke-width="1.6" aria-hidden="true" />
              <p class="text-[13px] font-medium">{{ t('common.empty') }}</p>
            </div>
          </AppCard>
        </div>
      </section>
    </div>
  </div>
</template>
