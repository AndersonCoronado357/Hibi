<script setup lang="ts">
import { Mail, Lock, User, AtSign, Eye, EyeOff, ArrowRight, ArrowLeft } from '@lucide/vue'

const { t } = useI18n()

definePageMeta({ layout: 'auth' })
useHead({ title: t('login.head.title') })

type Mode = 'login' | 'register' | 'forgot'
const mode = ref<Mode>('login')
const prevMode = ref<Mode>('login')

// Nombre de transición: 'lift' (sube) si recuperar está en juego, 'swap' (giro suave) si no.
const transitionName = computed(() =>
  mode.value === 'forgot' || prevMode.value === 'forgot' ? 'lift' : 'swap',
)

const { login, register, forgot, loginWithGoogle } = useAuth()

const name = ref('')
const identifier = ref('')
const email = ref('')
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const error = ref('')
const notice = ref('')

function go(to: Mode) {
  prevMode.value = mode.value
  mode.value = to
  error.value = ''
  notice.value = ''
}

async function submit() {
  error.value = ''
  notice.value = ''
  loading.value = true
  try {
    if (mode.value === 'forgot') {
      await forgot(email.value)
      notice.value = t('login.forgot.notice')
    } else if (mode.value === 'register') {
      await register({ name: name.value, email: email.value, password: password.value })
      await navigateTo('/inicio')
    } else {
      await login(identifier.value, password.value)
      await navigateTo('/inicio')
    }
  } catch (e: any) {
    error.value = e?.data?.message || e?.data?.statusMessage || t('login.errors.generic')
  } finally {
    loading.value = false
  }
}

function google() {
  loginWithGoogle()
}

const googleErrors = computed<Record<string, string>>(() => ({
  'google-off': t('login.errors.googleOff'),
  'google-state': t('login.errors.googleState'),
  'google-email': t('login.errors.googleEmail'),
  google: t('login.errors.google'),
}))
const route = useRoute()
onMounted(() => {
  const err = route.query.error
  if (err) error.value = googleErrors.value[String(err)] || t('login.errors.googleFallback')
})

const steps = computed(() => [
  t('login.forgot.steps.email'),
  t('login.forgot.steps.link'),
  t('login.forgot.steps.password'),
])
const fieldCls =
  'w-full h-12 rounded-[14px] bg-muted hover:bg-inset pl-11 pr-4 text-[15px] text-fg outline-none transition-colors duration-200 ease-soft'
const googleBtn =
  'w-full h-12 rounded-[14px] bg-muted hover:bg-sky-soft text-fg hover:text-sky-deep font-semibold inline-flex items-center justify-center gap-2.5 transition-colors'
</script>

<template>
  <div class="auth-bg relative w-full h-full overflow-hidden" :class="`mode-${mode}`" style="perspective: 1600px">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <HibiCloud :size="110" class="absolute top-[8%] left-[6%] text-white opacity-30" />
      <HibiCloud :size="70" class="absolute bottom-[12%] left-[10%] text-white opacity-22" />
      <HibiCloud :size="80" class="absolute top-[10%] right-[8%] text-white opacity-28" />
      <HibiCloud :size="58" class="absolute bottom-[16%] right-[12%] text-white opacity-20" />
    </div>

    <Transition :name="transitionName" :duration="{ enter: 850, leave: 440 }">
      <!-- ╭─ ENTRAR · marca IZQUIERDA ─╮ -->
      <div v-if="mode === 'login'" key="login" class="relative z-10 flex w-full h-full">
        <aside class="hidden md:flex md:w-1/2 flex-col items-center justify-center text-center px-12">
          <MascotCloud :size="172" class="text-white" />
          <h1 class="mt-6 text-[42px] font-extrabold text-[#1c4258] tracking-tight leading-none">{{ t('login.brand.loginTitle') }}</h1>
          <p class="mt-1 text-[#14202b] font-extrabold tracking-[0.32em] text-sm">日々</p>
          <p class="mt-5 text-[#1c4258] max-w-[18rem] leading-relaxed font-semibold">{{ t('login.brand.loginTagline') }}</p>
        </aside>
        <main class="relative flex-1 flex flex-col items-center justify-start pt-[3vh] md:place-items-center md:pt-0 scroll-area p-5 md:px-10 md:flex md:flex-col md:justify-center">
          <div class="w-full max-w-[380px] mx-auto px-1">
            <div class="md:hidden flex flex-col items-center mb-2 mt-2"><MascotCloud :size="142" class="text-white" /></div>
            <p class="md:hidden text-center text-[#14202b] font-extrabold tracking-[0.32em] text-sm mb-6">日々</p>
            <h2 class="text-[26px] font-extrabold text-fg tracking-tight">{{ t('login.signIn.heading') }}</h2>
            <p class="mt-1.5 text-fg-muted">{{ t('login.signIn.subtitle') }}</p>
            <form class="flex flex-col gap-3.5 mt-5" @submit.prevent="submit">
              <div class="flex flex-col gap-1.5">
                <label class="text-[13px] font-semibold text-fg-muted px-1">{{ t('login.signIn.identifierLabel') }}</label>
                <div class="relative"><AtSign class="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-fg-subtle" :stroke-width="1.8" aria-hidden="true" /><input v-model="identifier" type="text" autocomplete="username" spellcheck="false" :placeholder="t('login.signIn.identifierPlaceholder')" :class="fieldCls" /></div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[13px] font-semibold text-fg-muted px-1">{{ t('login.signIn.passwordLabel') }}</label>
                <div class="relative"><Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-fg-subtle" :stroke-width="1.8" /><input v-model="password" :type="showPw ? 'text' : 'password'" autocomplete="current-password" :placeholder="t('login.signIn.passwordPlaceholder')" :class="[fieldCls, 'pr-12']" /><button type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center size-8 rounded-[10px] text-fg-subtle hover:text-fg hover:bg-inset transition-colors" :aria-label="showPw ? t('login.password.hide') : t('login.password.show')" @click="showPw = !showPw"><component :is="showPw ? EyeOff : Eye" class="size-[18px]" :stroke-width="1.8" /></button></div>
              </div>
              <div class="flex justify-end -mt-1"><button type="button" class="text-[13px] text-sky-deep font-semibold hover:underline" @click="go('forgot')">{{ t('login.signIn.forgot') }}</button></div>
              <p v-if="error" role="alert" class="bg-pink-soft text-pink-deep rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold">{{ error }}</p>
              <p v-if="notice" role="status" aria-live="polite" class="bg-sky-soft text-sky-deep rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold">{{ notice }}</p>
              <AppButton type="submit" :loading="loading" block><span class="inline-flex items-center gap-2">{{ t('login.signIn.submit') }}<ArrowRight class="size-[18px]" :stroke-width="2.3" /></span></AppButton>
              <div class="text-center text-[13px] text-fg-subtle">{{ t('login.signIn.or') }}</div>
              <button type="button" :class="googleBtn" @click="google"><svg viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>{{ t('login.signIn.google') }}</button>
            </form>
            <p class="mt-6 text-center text-[14px] text-fg-muted">{{ t('login.signIn.noAccount') }} <button type="button" class="text-sky-deep font-bold hover:underline ml-1" @click="go('register')">{{ t('login.signIn.registerLink') }}</button></p>
          </div>
        </main>
      </div>

      <!-- ╭─ CREAR CUENTA · espejo del login (marca DERECHA) ─╮ -->
      <div v-else-if="mode === 'register'" key="register" class="relative z-10 flex md:flex-row-reverse w-full h-full">
        <aside class="hidden md:flex md:w-1/2 flex-col items-center justify-center text-center px-12">
          <MascotCloud :size="172" class="text-white" />
          <h1 class="mt-6 text-[42px] font-extrabold text-[#1c4258] tracking-tight leading-none">{{ t('login.brand.registerTitle') }}</h1>
          <p class="mt-1 text-[#14202b] font-extrabold tracking-[0.32em] text-sm">日々</p>
          <p class="mt-5 text-[#1c4258] max-w-[18rem] leading-relaxed font-semibold">{{ t('login.brand.registerTagline') }}</p>
        </aside>
        <main class="relative flex-1 flex flex-col items-center justify-start pt-[3vh] md:pt-0 md:flex md:flex-col md:justify-center scroll-area p-5 md:px-10">
          <div class="w-full max-w-[380px] mx-auto px-1">
            <div class="md:hidden flex flex-col items-center mb-6 mt-2"><MascotCloud :size="142" class="text-white" /></div>
            <h2 class="text-[26px] font-extrabold text-fg tracking-tight">{{ t('login.register.heading') }}</h2>
            <p class="mt-1.5 text-fg-muted">{{ t('login.register.subtitle') }}</p>
            <form class="flex flex-col gap-3.5 mt-5" @submit.prevent="submit">
              <div class="flex flex-col gap-1.5">
                <label class="text-[13px] font-semibold text-fg-muted px-1">{{ t('login.register.nameLabel') }}</label>
                <div class="relative"><User class="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-fg-subtle" :stroke-width="1.8" /><input v-model="name" type="text" autocomplete="name" :placeholder="t('login.register.namePlaceholder')" :class="fieldCls" /></div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[13px] font-semibold text-fg-muted px-1">{{ t('login.register.emailLabel') }}</label>
                <div class="relative"><Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-fg-subtle" :stroke-width="1.8" /><input v-model="email" type="email" autocomplete="email" :placeholder="t('login.register.emailPlaceholder')" :class="fieldCls" /></div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[13px] font-semibold text-fg-muted px-1">{{ t('login.register.passwordLabel') }}</label>
                <div class="relative"><Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-fg-subtle" :stroke-width="1.8" /><input v-model="password" :type="showPw ? 'text' : 'password'" autocomplete="new-password" :placeholder="t('login.register.passwordPlaceholder')" :class="[fieldCls, 'pr-12']" /><button type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center size-8 rounded-[10px] text-fg-subtle hover:text-fg hover:bg-inset transition-colors" :aria-label="showPw ? t('login.password.hide') : t('login.password.show')" @click="showPw = !showPw"><component :is="showPw ? EyeOff : Eye" class="size-[18px]" :stroke-width="1.8" /></button></div>
              </div>
              <p v-if="error" role="alert" class="bg-pink-soft text-pink-deep rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold">{{ error }}</p>
              <p v-if="notice" role="status" aria-live="polite" class="bg-sky-soft text-sky-deep rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold">{{ notice }}</p>
              <AppButton type="submit" :loading="loading" block><span class="inline-flex items-center gap-2">{{ t('login.register.submit') }}<ArrowRight class="size-[18px]" :stroke-width="2.3" /></span></AppButton>
              <button type="button" :class="googleBtn" @click="google"><svg viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>{{ t('login.register.google') }}</button>
            </form>
            <p class="mt-6 text-center text-[14px] text-fg-muted">{{ t('login.register.hasAccount') }} <button type="button" class="text-sky-deep font-bold hover:underline ml-1" @click="go('login')">{{ t('login.register.loginLink') }}</button></p>
          </div>
        </main>
      </div>

      <!-- ╭─ RECUPERAR · nube + degradado arriba · barra de progreso · correo al centro ─╮ -->
      <div v-else key="forgot" class="relative z-10 flex flex-col items-center w-full h-full scroll-area px-6">
        <div class="shrink-0 pt-[14vh] pb-6 flex flex-col items-center text-center">
          <MascotCloud :size="140" class="text-white" />
          <h2 class="mt-4 text-[28px] font-extrabold text-[#1c4258] tracking-tight">{{ t('login.forgot.heading') }}</h2>
          <p class="mt-1.5 text-[#2c6189] font-medium max-w-[26rem]">{{ t('login.forgot.subtitle') }}</p>
        </div>

        <div class="flex-1 w-full max-w-[440px] flex flex-col justify-start pt-2 pb-10">
          <!-- Barra de progreso -->
          <ol class="flex items-center mb-8">
            <li v-for="(s, i) in steps" :key="s" class="flex items-center" :class="i < steps.length - 1 ? 'flex-1' : ''">
              <span
                class="grid place-items-center size-8 rounded-full font-bold text-[13px] shrink-0"
                :class="i === 0 ? 'bg-sky text-[#1f4660]' : 'bg-muted text-fg-subtle'"
              >{{ i + 1 }}</span>
              <span class="ml-2 text-[12.5px] font-semibold whitespace-nowrap" :class="i === 0 ? 'text-fg' : 'text-fg-subtle'">{{ s }}</span>
              <span v-if="i < steps.length - 1" class="flex-1 h-[3px] rounded-full bg-muted mx-3" />
            </li>
          </ol>

          <!-- Formulario de correo -->
          <form class="flex flex-col gap-4" @submit.prevent="submit">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-fg-muted px-1">{{ t('login.forgot.emailLabel') }}</label>
              <div class="relative"><Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-fg-subtle" :stroke-width="1.8" /><input v-model="email" type="email" autocomplete="email" :placeholder="t('login.forgot.emailPlaceholder')" :class="fieldCls" /></div>
            </div>
            <p v-if="error" role="alert" class="bg-pink-soft text-pink-deep rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold">{{ error }}</p>
            <p v-if="notice" role="status" aria-live="polite" class="bg-sky-soft text-sky-deep rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold">{{ notice }}</p>
            <AppButton type="submit" :loading="loading" block><span class="inline-flex items-center gap-2">{{ t('login.forgot.submit') }}<ArrowRight class="size-[18px]" :stroke-width="2.3" /></span></AppButton>
            <button type="button" class="inline-flex items-center justify-center gap-1.5 text-[14px] text-fg-muted hover:text-fg font-semibold transition-colors" @click="go('login')"><ArrowLeft class="size-[17px]" :stroke-width="2" />{{ t('login.forgot.back') }}</button>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* En MÓVIL: franja de cielo bien definida en la parte de arriba (donde está
   la mascota), transición rápida a blanco para que el formulario tenga aire. */
.mode-login,
.mode-register,
.mode-forgot {
  background: linear-gradient(to bottom, var(--color-sky) 0%, var(--color-sky) 22%, var(--bg-card) 32%, var(--bg-card) 100%);
}

@media (min-width: 768px) {
  /* En desktop cada vista tiene su distribución de color propia */
  .mode-login {
    background: linear-gradient(to right, var(--color-sky) 0%, var(--color-sky) 28%, var(--bg-card) 62%, var(--bg-card) 100%);
  }
  .mode-register {
    background: linear-gradient(to left, var(--color-sky) 0%, var(--color-sky) 28%, var(--bg-card) 62%, var(--bg-card) 100%);
  }
  .mode-forgot {
    background: linear-gradient(to bottom, var(--color-sky) 0%, var(--color-sky) 42%, var(--bg-card) 68%, var(--bg-card) 100%);
  }
}
</style>
