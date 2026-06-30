import { markRaw, type Component } from 'vue'
import {
  Calendar,
  ListTodo,
  NotebookPen,
  BellRing,
  Flame,
  Target,
  BookHeart,
  Timer,
  Repeat,
  ListChecks,
  Wallet,
  Music,
  MessageCircle,
  Cloud,
  Settings,
} from '@lucide/vue'

export interface NavItem {
  /** clave i18n bajo `nav.*` */
  key: string
  to: string
  icon: Component
}

/**
 * Módulos de la app (sin "Hoy" — se accede desde el logo arriba a la izquierda).
 */
export function useNav() {
  const items: NavItem[] = [
    { key: 'calendar', to: '/calendar', icon: markRaw(Calendar) },
    { key: 'tasks', to: '/tasks', icon: markRaw(ListTodo) },
    { key: 'notes', to: '/notes', icon: markRaw(NotebookPen) },
    { key: 'reminders', to: '/reminders', icon: markRaw(BellRing) },
    { key: 'habits', to: '/habits', icon: markRaw(Flame) },
    { key: 'goals', to: '/goals', icon: markRaw(Target) },
    { key: 'journal', to: '/journal', icon: markRaw(BookHeart) },
    { key: 'focus', to: '/focus', icon: markRaw(Timer) },
    { key: 'routines', to: '/routines', icon: markRaw(Repeat) },
    { key: 'lists', to: '/lists', icon: markRaw(ListChecks) },
    { key: 'finances', to: '/finances', icon: markRaw(Wallet) },
    { key: 'spotify', to: '/spotify', icon: markRaw(Music) },
    { key: 'chat', to: '/chat', icon: markRaw(MessageCircle) },
    { key: 'hibi', to: '/hibi', icon: markRaw(Cloud) },
  ]

  const settings: NavItem = { key: 'settings', to: '/settings', icon: markRaw(Settings) }

  return { items, settings }
}
