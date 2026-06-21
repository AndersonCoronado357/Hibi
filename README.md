# Hibi 日々

App web full-stack multiusuario para organización personal: calendario, tareas, notas, recordatorios, hábitos, objetivos, diario, enfoque, rutinas, listas, finanzas e IA. Estética kawaii pastel. Solo navegador (no instalable).

> **Hibi** (日々) significa "día a día" en japonés.

## Stack

Nuxt 3 · Vue 3 · TypeScript · Tailwind CSS 4 · Pinia · TanStack Vue Query · Reka UI · @vueuse/motion · Lucide · Supabase · Groq.

## Desarrollo

```bash
npm install --legacy-peer-deps   # instala dependencias
npm run dev                      # arranca en http://localhost:3100
npm run dev:tunnel               # variante para exponer en la LAN (móvil + Cloudflare tunnel)
```

`dev:tunnel` también imprime un **código QR** para abrir la app desde el móvil o la tablet en la misma red.

## Despliegue (acmsy)

El proyecto cumple el contrato de despliegue de acmsy:

- **Stack detectado:** Node (Nuxt 3 + Nitro).
- **Build:** `npm run build` (genera `.output/`).
- **Start:** `npm start` (corre `node .output/server/index.mjs`).
- **Puerto interno:** lee `PORT` (por defecto `3000`); escucha en `0.0.0.0`.
- **Base de datos:** todavía no se usa BD en el servidor — la persistencia
  futura irá vía Supabase (cliente directo desde el frontend). Las vars
  `DB_*` / `DATABASE_URL` están reservadas en `.env.example` por si se
  añade una BD gestionada por acmsy más adelante.
- **Dockerfile:** incluido. Base `node:22-bookworm-slim`. `npm install
  --legacy-peer-deps` + `npm run build` + `npm start`.
- **Proxy:** respeta `X-Forwarded-*` (gestionado por Nitro por defecto).

Subdominio típico: `hibi.acmsy.com`.

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
