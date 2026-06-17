<script setup lang="ts">
import { Send, Sparkles, Trash2 } from '@lucide/vue'

useHead({ title: 'Hibi — Chat' })

const messages = useChatMessages()
const draft = ref('')
const sending = ref(false)
const listRef = ref<HTMLElement | null>(null)

const suggestions = [
  'Resúmeme el día',
  'Nueva tarea: comprar pan',
  'Anota una idea',
  'Recuérdame en 1h',
  'Cómo voy con mis hábitos',
  '¿Qué tengo mañana?',
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

function clearChat() {
  messages.value = [
    {
      id: 'reset' + Date.now().toString(36),
      role: 'assistant',
      text: '¡Hola de nuevo! Cuéntame en qué te ayudo.',
      at: Date.now(),
    },
  ]
}

function fmtTime(at: number) {
  const d = new Date(at)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await nextTick()
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Cabecera con mascota -->
    <header class="shrink-0 px-4 md:px-7 pt-5 pb-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="grid place-items-center size-12 rounded-[16px] bg-sky-soft">
          <MascotCloud :size="44" class="text-sky" />
        </span>
        <div>
          <h1 class="text-[22px] font-extrabold text-fg leading-tight">Nubecita</h1>
          <p class="text-[12.5px] text-sky-deep font-bold leading-tight inline-flex items-center gap-1">
            <Sparkles class="size-3.5" :stroke-width="2.2" /> Tu asistente
          </p>
        </div>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-muted text-fg-muted hover:text-fg hover:bg-pink-soft hover:text-pink-deep text-[13px] font-semibold transition-colors"
        @click="clearChat"
      >
        <Trash2 class="size-[15px]" :stroke-width="1.9" />
        <span class="hidden sm:inline">Limpiar</span>
      </button>
    </header>

    <!-- Mensajes -->
    <div ref="listRef" class="flex-1 min-h-0 overflow-y-auto scroll-area px-4 md:px-7 pb-4">
      <div class="max-w-[760px] mx-auto flex flex-col gap-3">
        <div
          v-for="m in messages"
          :key="m.id"
          class="flex flex-col max-w-[88%] md:max-w-[78%]"
          :class="m.role === 'user' ? 'self-end items-end' : 'self-start items-start'"
        >
          <div class="flex items-end gap-2" :class="m.role === 'user' ? 'flex-row-reverse' : ''">
            <span
              v-if="m.role === 'assistant'"
              class="grid place-items-center size-8 rounded-[10px] bg-sky-soft shrink-0"
            >
              <MascotCloud :size="28" class="text-sky" />
            </span>
            <div
              class="px-4 py-2.5 rounded-[18px] text-[14.5px] leading-snug"
              :class="
                m.role === 'user'
                  ? 'bg-sky text-[#1f4661] rounded-br-[6px]'
                  : 'bg-card text-fg rounded-bl-[6px]'
              "
            >{{ m.text }}</div>
          </div>
          <span class="mt-1 px-1 text-[10.5px] text-fg-subtle" :class="m.role === 'assistant' ? 'ml-10' : ''">{{ fmtTime(m.at) }}</span>
        </div>
        <div v-if="sending" class="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] bg-card ml-10">
          <span class="size-1.5 rounded-full bg-fg-subtle animate-pulse" />
          <span class="size-1.5 rounded-full bg-fg-subtle animate-pulse" style="animation-delay: 120ms" />
          <span class="size-1.5 rounded-full bg-fg-subtle animate-pulse" style="animation-delay: 240ms" />
        </div>
      </div>
    </div>

    <!-- Composer -->
    <div class="shrink-0 px-4 md:px-7 pb-5 pt-2 bg-base">
      <div class="max-w-[760px] mx-auto flex flex-col gap-2.5">
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="s in suggestions"
            :key="s"
            type="button"
            class="text-[12.5px] font-semibold px-3 h-8 rounded-full bg-muted hover:bg-sky-soft text-fg-muted hover:text-sky-deep transition-colors"
            @click="send(s)"
          >{{ s }}</button>
        </div>
        <form class="relative" @submit.prevent="send()">
          <input
            v-model="draft"
            type="text"
            placeholder="Escribe a tu nubecita…"
            class="w-full h-13 rounded-full bg-card focus:bg-inset pl-5 pr-14 text-[15px] text-fg outline-none transition-colors"
          />
          <button
            type="submit"
            :disabled="!draft.trim() || sending"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center size-10 rounded-full bg-sky text-[#1f4661] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-[0.96] transition-[filter,opacity]"
            aria-label="Enviar"
          >
            <Send class="size-[17px]" :stroke-width="2.1" />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.h-13 { height: 3.25rem; }
</style>
