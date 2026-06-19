<script setup lang="ts">
import { Send, Trash2, MessageCircle, Sparkles, Plus, ChevronLeft } from '@lucide/vue'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'

useHead({ title: 'Hibi — Chat' })

const conversations = useChatConversations()
const activeId = useActiveChatId()
const activeConv = useActiveConversation()
const messages = useChatMessages()
const draft = ref('')
const sending = ref(false)
const listRef = ref<HTMLElement | null>(null)
const showHistory = ref(true) // panel colapsable

const SUGGESTIONS = [
  { text: 'Resúmeme el día',         tone: 'bg-sky-soft text-sky-deep' },
  { text: 'Nueva tarea, comprar pan', tone: 'bg-mint text-[#34936a]' },
  { text: 'Anota una idea',          tone: 'bg-cream text-[#bf8f2e]' },
  { text: 'Recuérdame en 1 hora',    tone: 'bg-peach text-[#c5733f]' },
  { text: 'Cómo voy con mis hábitos', tone: 'bg-pink-soft text-pink-deep' },
  { text: 'Qué tengo mañana',        tone: 'bg-lavender text-[#7a63c0]' },
]

async function send(text?: string) {
  const t = (text ?? draft.value).trim()
  if (!t || sending.value) return
  draft.value = ''
  sending.value = true
  await sendUserMessage(t)
  sending.value = false
  await nextTick()
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
}

function fmtTime(at: number) {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtConvDate(at: number) {
  const d = new Date(at)
  if (isToday(d)) return 'Hoy ' + format(d, 'HH:mm')
  if (isYesterday(d)) return 'Ayer'
  return format(d, "d 'de' MMM", { locale: es })
}

function onNewConversation() {
  startNewConversation()
  draft.value = ''
}

function onSwitchConversation(id: string) {
  switchToConversation(id)
}

function onDeleteConversation(id: string, e: Event) {
  e.stopPropagation()
  deleteConversation(id)
}

// El user "ha hablado" en la conversación activa cuando hay al menos un msg del user
const userHasSpoken = computed(() => messages.value.some(m => m.role === 'user'))

onMounted(async () => {
  await nextTick()
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
})

watch(() => activeId.value, async () => {
  draft.value = ''
  await nextTick()
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
})
</script>

<template>
  <div class="h-full w-full flex flex-col gap-3 px-4 md:px-7 py-5 relative overflow-hidden">
    <!-- Decoración cute de fondo (solo desktop) -->
    <HibiCloud :size="160" float :duration="8" class="hidden md:block absolute -top-8 -right-8 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="110" float :duration="10" :delay="1.4" class="hidden md:block absolute bottom-6 -left-6 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[16%] left-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <!-- Header -->
    <div class="relative z-10">
      <PageHero :icon="MessageCircle" tone="sky" title="Chat con Hibi" subtitle="Pregunta, anota o pide un resumen">
        <template #actions>
          <button
            type="button"
            class="group/hibibtn relative inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full bg-card text-sky-deep hover:bg-sky-deep hover:text-white text-[13.5px] font-bold transition-[background-color,color] duration-200"
            @click="onNewConversation"
          >
            <span class="inline-flex items-center gap-1.5 transition-opacity duration-200 group-hover/hibibtn:opacity-0">
              <Plus class="size-[15px]" :stroke-width="2.4" aria-hidden="true" />
              <span class="hidden sm:inline">Nueva</span>
            </span>
            <HibiButtonFace variant="primary" />
          </button>
        </template>
      </PageHero>
    </div>

    <!-- Cuerpo: layout 2 columnas (sidebar historial + chat) -->
    <div class="relative z-10 flex-1 min-h-0 flex gap-3">
      <!-- Panel historial: UNA sola card con ancho reactivo para animar el colapso -->
      <AppCard
        class="hibi-collapsible hidden md:flex shrink-0 flex-col overflow-hidden"
        :class="showHistory ? 'w-[260px]' : 'w-[44px] items-center justify-center cursor-pointer hover:bg-muted'"
        :padded="false"
        @click="!showHistory && (showHistory = true)"
      >
        <!-- Modo COLAPSADO -->
        <button v-show="!showHistory" type="button" class="grid place-items-center size-9 rounded-full text-fg-muted hover:text-fg" title="Mostrar historial">
          <MessageCircle class="size-[18px]" :stroke-width="1.9" />
        </button>
        <!-- Modo EXPANDIDO -->
        <template v-if="showHistory">
        <header class="shrink-0 px-4 pt-4 pb-3 flex items-center justify-between">
          <h2 class="text-[14px] font-extrabold text-fg flex items-center gap-2">
            <MessageCircle class="size-[15px] text-sky-deep" :stroke-width="2" />
            Historial
          </h2>
          <button type="button" class="grid place-items-center size-8 rounded-full text-fg-subtle hover:text-fg hover:bg-muted" aria-label="Ocultar historial" @click.stop="showHistory = false">
            <ChevronLeft class="size-[16px]" :stroke-width="2" />
          </button>
        </header>
        <ul class="hibi-anim-slide-right flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-3 flex flex-col gap-1.5">
          <li v-for="c in conversations" :key="c.id">
            <div
              role="button"
              tabindex="0"
              :aria-pressed="c.id === activeId"
              class="group/conv relative px-3 py-2.5 rounded-[14px] cursor-pointer transition-[background-color] outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
              :class="c.id === activeId ? 'bg-sky-soft' : 'hover:bg-muted'"
              @click="onSwitchConversation(c.id)"
              @keydown.enter.prevent="onSwitchConversation(c.id)"
              @keydown.space.prevent="onSwitchConversation(c.id)"
            >
              <div class="flex items-start gap-2.5 pr-7">
                <HibiCloudIcon :size="36" :icon="MessageCircle" :icon-size="14" :cloud-color="c.id === activeId ? 'text-card' : 'text-sky-soft'" :icon-color="c.id === activeId ? 'text-sky-deep' : 'text-sky-deep'" :icon-stroke="2" class="shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <p class="text-[13.5px] font-bold text-fg truncate" :class="c.id === activeId ? 'text-sky-deep' : ''">{{ c.title }}</p>
                  <p class="text-[11px] text-fg-muted truncate">{{ fmtConvDate(c.updatedAt) }} · {{ c.messages.filter(m => m.role === 'user').length }} msgs</p>
                </div>
              </div>
              <button
                v-if="conversations.length > 1"
                type="button"
                class="absolute top-1.5 right-1.5 grid place-items-center size-7 rounded-full text-fg-subtle opacity-0 group-hover/conv:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]"
                aria-label="Eliminar conversación"
                @click="(e) => onDeleteConversation(c.id, e)"
              >
                <Trash2 class="size-[13px]" :stroke-width="2" />
              </button>
            </div>
          </li>
        </ul>
        </template>
      </AppCard>

      <!-- PANEL DE CHAT -->
      <AppCard class="flex-1 min-w-0 flex flex-col !p-0 overflow-hidden">
        <!-- Mensajes -->
        <div ref="listRef" class="flex-1 min-h-0 overflow-y-auto scroll-area px-4 md:px-8 pt-6 pb-4">
          <!-- Empty state cute: HIBI grande con cara saludando + sugerencias -->
          <div v-if="!userHasSpoken" class="h-full flex flex-col items-center justify-center gap-4 py-8">
            <div class="relative">
              <HibiCloud :size="180" face class="text-sky-soft mascot-hello" aria-hidden="true" />
              <HibiSparkle :size="20" twinkle :duration="2" class="absolute -top-1 right-4 text-sky-deep opacity-90" />
              <HibiSparkle :size="14" twinkle :duration="2.4" :delay="0.6" class="absolute top-6 -left-3 text-pink-deep opacity-85" />
              <HibiHeart :size="16" beat :duration="2.4" class="absolute bottom-2 -right-2 text-pink-deep opacity-85" />
            </div>
            <div class="text-center">
              <p class="text-[18px] font-extrabold text-fg">¡Hola! Soy Hibi</p>
              <p class="text-[13px] text-fg-muted mt-1 max-w-[36ch]">Cuéntame qué necesitas o toca una sugerencia para empezar.</p>
            </div>
          </div>

          <!-- Lista de mensajes -->
          <ul v-else class="hibi-anim-fade-up w-full flex flex-col gap-3">
            <li
              v-for="m in messages"
              :key="m.id"
              class="flex flex-col max-w-[88%] md:max-w-[70%]"
              :class="m.role === 'user' ? 'self-end items-end' : 'self-start items-start'"
            >
              <div
                v-if="m.role === 'user'"
                class="px-4 py-2.5 rounded-[20px] rounded-br-[8px] text-[14.5px] leading-snug bg-sky text-[#1f4661] font-semibold"
              >{{ m.text }}</div>
              <div v-else class="flex items-start gap-2.5">
                <HibiCloudIcon :size="36" :icon="Sparkles" :icon-size="14" cloud-color="text-sky-soft" icon-color="text-sky-deep" :icon-stroke="2" class="shrink-0 mt-1" />
                <div class="px-4 py-2.5 rounded-[20px] rounded-tl-[8px] text-[14.5px] leading-snug bg-muted text-fg">{{ m.text }}</div>
              </div>
              <span class="mt-1 px-1 text-[10.5px] text-fg-subtle" :class="m.role === 'user' ? 'mr-1' : 'ml-[44px]'">{{ fmtTime(m.at) }}</span>
            </li>
            <li v-if="sending" class="self-start flex items-start gap-2.5">
              <HibiCloudIcon :size="36" :icon="Sparkles" :icon-size="14" cloud-color="text-sky-soft" icon-color="text-sky-deep" :icon-stroke="2" class="shrink-0 mt-1" />
              <div class="inline-flex items-center gap-1.5 px-4 py-3 rounded-[20px] rounded-tl-[8px] bg-muted">
                <span class="size-1.5 rounded-full bg-sky-deep animate-pulse" />
                <span class="size-1.5 rounded-full bg-sky-deep animate-pulse" style="animation-delay: 120ms" />
                <span class="size-1.5 rounded-full bg-sky-deep animate-pulse" style="animation-delay: 240ms" />
              </div>
            </li>
          </ul>
        </div>

        <!-- Composer -->
        <div class="shrink-0 px-4 md:px-6 pb-5 pt-2">
          <div class="w-full flex flex-col gap-3">
            <!-- Chips solo cuando el user aún no ha hablado -->
            <Transition name="chips">
              <div v-if="!userHasSpoken" class="flex flex-wrap gap-2">
                <button
                  v-for="s in SUGGESTIONS"
                  :key="s.text"
                  type="button"
                  class="text-[12.5px] font-bold px-3.5 h-9 rounded-full hover:brightness-95 transition-[filter] duration-200"
                  :class="s.tone"
                  @click="send(s.text)"
                >{{ s.text }}</button>
              </div>
            </Transition>

            <form class="relative" @submit.prevent="send()">
              <label for="chat-input" class="sr-only">Escribe a Hibi</label>
              <input
                id="chat-input"
                v-model="draft"
                type="text"
                placeholder="Escribe a Hibi…"
                class="w-full h-13 rounded-full bg-muted focus:bg-inset pl-5 pr-14 text-[15px] text-fg outline-none transition-[background-color] duration-200"
              />
              <button
                type="submit"
                :disabled="!draft.trim() || sending"
                class="group/hibibtn absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center size-10 rounded-full bg-sky text-[#1f4661] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sky-deep hover:text-white transition-[background-color,color]"
                aria-label="Enviar"
              >
                <Send class="size-[17px] transition-opacity group-hover/hibibtn:opacity-0" :stroke-width="2.1" aria-hidden="true" />
                <HibiButtonFace variant="primary" />
              </button>
            </form>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.h-13 { height: 3.25rem; }

.chips-enter-active, .chips-leave-active { transition: opacity 0.18s ease, transform 0.22s ease; }
.chips-enter-from, .chips-leave-to { opacity: 0; transform: translateY(4px); }

/* Saludo Hibi: balanceo suave continuo (mejor que un fade) */
.mascot-hello {
  animation: hibiHelloBob 3.2s ease-in-out infinite;
  display: inline-block;
  transform-origin: center bottom;
}
@keyframes hibiHelloBob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25%      { transform: translateY(-6px) rotate(-1.5deg); }
  75%      { transform: translateY(-6px) rotate(1.5deg); }
}
@media (prefers-reduced-motion: reduce) {
  .mascot-hello { animation: none; }
}
</style>
