# Hibi 日々

App web full-stack multiusuario para organización personal: calendario, tareas, notas, recordatorios, hábitos, objetivos, diario, enfoque, rutinas, listas, finanzas e IA. Estética kawaii pastel. Solo navegador (no instalable).

> **Hibi** (日々) significa "día a día" en japonés.

## Stack

Nuxt 3 · Vue 3 · TypeScript · Tailwind CSS 4 · Pinia · TanStack Vue Query · Reka UI · @vueuse/motion · Lucide · Supabase · Groq.

## Desarrollo

```bash
npm install       # instala dependencias
npm run dev       # arranca en http://localhost:3100 (y en tu LAN para móvil)
```

Al arrancar con `dev` el servidor se expone en la IP de la red local y se imprime un **código QR** en la terminal para abrir la app desde el móvil o la tablet conectados a la misma red.

## Variables de entorno

Copia `.env.example` a `.env` y rellena las claves a medida que se vayan necesitando (Supabase para auth/datos, Groq para IA). Mientras no haya claves, la app funciona en modo UI sin backend.

## Estructura

```
assets/css/main.css     Design tokens + estilos base (paleta, temas, tipografía)
components/ui/           Componentes propios (AppButton, AppCard, AppInput, …)
components/shell/        Layout: sidebar, topbar, bottom nav, theme switcher
composables/             Lógica reutilizable (navegación, saludo, tema)
layouts/default.vue      App shell (100% alto/ancho, sin scroll global)
pages/                   Un módulo por ruta
i18n/locales/            Traducciones es / en
plugins/                 Vue Query, etc.
server/                  Endpoints (auth, IA) — se añade más adelante
```

## Reglas del proyecto

Cero modales · sin scroll global · 100% alto y ancho · sin degradados · sin colores saturados · todo custom (nada de shadcn) · accesibilidad AA · frontend pulido desde el día uno.
