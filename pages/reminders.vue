<script setup lang="ts">
import { Plus, BellRing, AlarmClock, Bell, Check } from '@lucide/vue'

useHead({ title: 'Hibi — Recordatorios' })

interface Reminder { id: string; title: string; when: string; group: 'Hoy' | 'Mañana' | 'Esta semana' | 'Más adelante'; alarm?: boolean; pre?: string }
const reminders: Reminder[] = [
  { id: 'r1', title: 'Tomar la pastilla', when: '14:00', group: 'Hoy', alarm: true, pre: '10 min antes' },
  { id: 'r2', title: 'Llamar a mamá', when: '19:30', group: 'Hoy' },
  { id: 'r3', title: 'Yoga online', when: 'Mañana 07:30', group: 'Mañana', pre: '15 min antes' },
  { id: 'r4', title: 'Reunión con Diego', when: 'Mañana 11:00', group: 'Mañana' },
  { id: 'r5', title: 'Renovar el carnet', when: 'Vie 10:00', group: 'Esta semana' },
  { id: 'r6', title: 'Cumple de Lu', when: 'Lun 8 jun', group: 'Esta semana', alarm: true },
  { id: 'r7', title: 'Revisar suscripción Netflix', when: '15 jun', group: 'Más adelante' },
]
const remindersData = ref(reminders)
const groups: Reminder['group'][] = ['Hoy', 'Mañana', 'Esta semana', 'Más adelante']
function inGroup(g: Reminder['group']) { return remindersData.value.filter(r => r.group === g) }

const creating = ref(false)
const newTitle = ref(''); const newWhen = ref(''); const newGroup = ref<Reminder['group']>('Hoy'); const newAlarm = ref(false)
let nextId = 100
function startCreate() { creating.value = true; nextTick(() => document.getElementById('new-rem-title')?.focus()) }
function cancelCreate() { creating.value = false; newTitle.value = ''; newWhen.value = ''; newAlarm.value = false }
function saveReminder() {
  const t = newTitle.value.trim(); if (!t) return
  remindersData.value.unshift({ id: 'r' + (nextId++), title: t, when: newWhen.value || 'Sin hora', group: newGroup.value, alarm: newAlarm.value })
  cancelCreate()
}
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <!-- Toolbar -->
    <AppCard class="shrink-0 !p-3 md:!p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="grid place-items-center size-10 rounded-[13px] bg-peach text-[#c5733f]" aria-hidden="true"><BellRing class="size-5" :stroke-width="1.9" /></span>
        <div>
          <h1 class="text-[20px] md:text-[22px] font-extrabold text-fg leading-tight">Recordatorios</h1>
          <p class="text-[12.5px] text-fg-muted leading-tight">{{ reminders.length }} pendientes</p>
        </div>
      </div>
      <AppButton variant="primary" size="sm" @click="startCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Nuevo</AppButton>
    </AppCard>

    <!-- Timeline en card -->
    <AppCard class="flex-1 min-h-0 flex flex-col" :padded="false">
      <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-5 md:px-7 py-5">
        <div class="max-w-[640px] mx-auto">
          <Transition name="inline-form">
            <form v-if="creating" aria-label="Nuevo recordatorio" class="staggered bg-muted rounded-[16px] p-4 mb-4 flex flex-col gap-2.5" @submit.prevent="saveReminder" @keydown.escape="cancelCreate">
              <label for="new-rem-title" class="sr-only">Título</label>
              <input id="new-rem-title" v-model="newTitle" type="text" placeholder="¿Qué te recuerdo?" class="w-full h-10 rounded-[10px] bg-card focus:bg-inset px-3 text-[14.5px] font-semibold text-fg outline-none" />
              <div class="grid grid-cols-2 gap-2">
                <input v-model="newWhen" type="text" placeholder="14:00 o Mañana 09:30" class="h-10 rounded-[10px] bg-card focus:bg-inset px-3 text-[13px] text-fg outline-none" />
                <select v-model="newGroup" class="h-10 rounded-[10px] bg-card focus:bg-inset px-3 text-[13px] text-fg outline-none">
                  <option>Hoy</option><option>Mañana</option><option>Esta semana</option><option>Más adelante</option>
                </select>
              </div>
              <label class="inline-flex items-center gap-2 text-[13px] text-fg-muted">
                <input v-model="newAlarm" type="checkbox" class="size-4 accent-pink-deep" /> Con alarma sonora
              </label>
              <div class="flex items-center justify-end gap-2">
                <button type="button" class="h-9 px-3.5 rounded-[10px] text-[13px] font-semibold text-fg-muted hover:bg-card" @click="cancelCreate">Cancelar</button>
                <button type="submit" :disabled="!newTitle.trim()" class="h-9 px-4 rounded-[10px] bg-sky text-[#1f4661] text-[13px] font-bold disabled:opacity-50">Crear</button>
              </div>
            </form>
          </Transition>
          <div v-for="(g, gi) in groups" :key="g" :class="gi > 0 ? 'mt-6' : ''">
            <div class="flex items-center justify-between mb-2 px-1">
              <h2 class="text-[14px] font-extrabold text-fg">{{ g }}</h2>
              <span class="text-[11.5px] text-fg-muted font-bold">{{ inGroup(g).length }}</span>
            </div>
            <div class="relative pl-7">
              <div class="absolute left-3 top-2 bottom-2 w-px bg-muted" />
              <ul class="flex flex-col gap-2.5">
                <li v-for="r in inGroup(g)" :key="r.id" class="relative">
                  <span class="absolute -left-[19px] top-3 grid place-items-center size-6 rounded-full" :class="r.alarm ? 'bg-pink-soft text-pink-deep' : 'bg-sky-soft text-sky-deep'" aria-hidden="true">
                    <component :is="r.alarm ? AlarmClock : Bell" class="size-[13px]" :stroke-width="2.1" />
                  </span>
                  <div class="bg-muted rounded-[14px] p-3.5 flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-[14.5px] font-bold text-fg truncate">{{ r.title }}</p>
                      <p class="text-[12.5px] text-fg-muted mt-0.5">
                        {{ r.when }}<span v-if="r.pre">, <span class="font-semibold">{{ r.pre }}</span></span>
                      </p>
                    </div>
                    <button class="shrink-0 grid place-items-center size-8 rounded-full bg-card text-fg-subtle hover:text-[#34936a] hover:bg-mint transition-[background-color,color]" aria-label="Marcar hecho"><Check class="size-4" :stroke-width="2.3" /></button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
