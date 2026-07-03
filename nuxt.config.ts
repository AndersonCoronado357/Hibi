import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-06-07',
  devtools: { enabled: true },

  // El 3000 está reservado para otra app del usuario
  devServer: { port: 3100 },

  // Secrets solo-servidor. En prod los inyecta acmsy (useAcmsyAuth:true);
  // en dev salen del .env local. NUNCA hardcodear credenciales ni localhost.
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    mailFrom: process.env.MAIL_FROM || 'noreply@acmsy.com',
    mailFromName: process.env.MAIL_FROM_NAME || 'Hibi',
    origin: process.env.ORIGIN || '',
    acmsySubdomain: process.env.ACMSY_SUBDOMAIN || 'hibi',
    aiApiUrl: process.env.AI_API_URL || '',
    aiApiKey: process.env.AI_API_KEY || '',
    aiBasicAuth: process.env.AI_BASIC_AUTH || '', // "user:pass" para gateways con Basic auth (acmsy)
    aiModel: process.env.AI_MODEL || '',
    ollamaUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
  },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vueuse/motion/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/fonts',
    '@nuxtjs/i18n',
  ],

  css: ['~/assets/css/main.css'],

  // Componentes propios sin prefijo de carpeta: <AppButton>, <TheSidebar>, …
  components: [{ path: '~/components', pathPrefix: false }],

  vite: {
    plugins: [tailwindcss()],
    // Permite servir a traves de un tunel de Cloudflare (acceso desde el celular).
    server: {
      allowedHosts: ['.trycloudflare.com', '.cfargotunnel.com'],
    },
  },

  // Tema con identidad: data-theme="dark" sobre <html>, sin parpadeo en SSR
  colorMode: {
    // Siempre claro por defecto (no seguir el modo oscuro del dispositivo)
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
    dataValue: 'theme',
    storageKey: 'hibi-theme',
  },

  fonts: {
    families: [
      { name: 'M PLUS Rounded 1c', provider: 'google', weights: [400, 500, 700, 800] },
      { name: 'Quicksand', provider: 'google', weights: [400, 500, 700] },
    ],
  },

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'es',
    lazy: true,
    langDir: 'locales',
    bundle: { optimizeTranslationDirective: false },
    detectBrowserLanguage: false,
    locales: [
      {
        code: 'es', name: 'Español',
        files: ['es/common.json', 'es/auth.json', 'es/login.json', 'es/inicio.json', 'es/calendar.json', 'es/tasks.json', 'es/notes.json', 'es/reminders.json', 'es/habits.json', 'es/goals.json', 'es/journal.json', 'es/focus.json', 'es/routines.json', 'es/lists.json', 'es/finances.json', 'es/spotify.json', 'es/chat.json', 'es/settings.json', 'es/hibi.json'],
      },
      {
        code: 'en', name: 'English',
        files: ['en/common.json', 'en/auth.json', 'en/login.json', 'en/inicio.json', 'en/calendar.json', 'en/tasks.json', 'en/notes.json', 'en/reminders.json', 'en/habits.json', 'en/goals.json', 'en/journal.json', 'en/focus.json', 'en/routines.json', 'en/lists.json', 'en/finances.json', 'en/spotify.json', 'en/chat.json', 'en/settings.json', 'en/hibi.json'],
      },
    ],
  },

  typescript: {
    strict: true,
    // El type-check se ejecuta con `npm run typecheck`, no en cada arranque de dev
    typeCheck: false,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'Hibi',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Hibi — organiza tu día a día con cariño.' },
        { name: 'theme-color', content: '#e9f2fb' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Hibi' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/favicon.svg' },
      ],
    },
  },

  // Cabeceras de seguridad básicas (CSP/HSTS completas se añaden en la fase de seguridad)
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
    // La raíz redirige al login (la app entra desde ahí)
    '/': { redirect: '/login' },
    // El login es 100% interactivo (animaciones, cursor): renderizado en cliente.
    '/login': { ssr: false },
  },
})
