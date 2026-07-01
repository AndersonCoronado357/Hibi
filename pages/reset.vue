<script setup lang="ts">
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2 } from '@lucide/vue'

const { t } = useI18n()

definePageMeta({ layout: 'auth' })
useHead({ title: t('auth.reset.headTitle') })

const route = useRoute()
const { reset } = useAuth()

const token = computed(() => String(route.query.token || ''))
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const error = ref('')
const done = ref(false)

async function submit() {
  error.value = ''
  if (!token.value) {
    error.value = t('auth.reset.linkInvalid')
    return
  }
  loading.value = true
  try {
    await reset(token.value, password.value)
    done.value = true
    setTimeout(() => navigateTo('/inicio'), 1200)
  } catch (e: any) {
    error.value = e?.data?.message || e?.data?.statusMessage || t('auth.reset.genericError')
  } finally {
    loading.value = false
  }
}

const fieldCls =
  'w-full h-12 rounded-[14px] bg-muted hover:bg-inset pl-11 pr-4 text-[15px] text-fg outline-none transition-colors duration-200 ease-soft'
</script>

<template>
  <div class="auth-bg relative w-full h-full overflow-hidden mode-forgot">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <HibiCloud :size="110" class="absolute top-[8%] left-[6%] text-white opacity-30" />
      <HibiCloud :size="80" class="absolute top-[10%] right-[8%] text-white opacity-28" />
      <HibiCloud :size="58" class="absolute bottom-[16%] right-[12%] text-white opacity-20" />
    </div>

    <div class="relative z-10 flex flex-col items-center w-full h-full scroll-area px-6">
      <div class="shrink-0 pt-[14vh] pb-6 flex flex-col items-center text-center">
        <MascotCloud :size="140" class="text-white" />
        <h2 class="mt-4 text-[28px] font-extrabold text-[#1c4258] tracking-tight">{{ t('auth.reset.heading') }}</h2>
        <p class="mt-1.5 text-[#2c6189] font-medium max-w-[26rem]">{{ t('auth.reset.subtitle') }}</p>
      </div>

      <div class="flex-1 w-full max-w-[440px] flex flex-col justify-start pt-2 pb-10">
        <div v-if="done" class="flex flex-col items-center text-center gap-3 mt-4">
          <CheckCircle2 class="size-12 text-green-deep" :stroke-width="1.8" />
          <p class="text-fg font-semibold">{{ t('auth.reset.done') }}</p>
        </div>
        <form v-else class="flex flex-col gap-4" @submit.prevent="submit">
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-fg-muted px-1">{{ t('auth.reset.passwordLabel') }}</label>
            <div class="relative">
              <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-fg-subtle" :stroke-width="1.8" />
              <input v-model="password" :type="showPw ? 'text' : 'password'" autocomplete="new-password" :placeholder="t('auth.reset.passwordPlaceholder')" :class="[fieldCls, 'pr-12']" />
              <button type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center size-8 rounded-[10px] text-fg-subtle hover:text-fg hover:bg-inset transition-colors" :aria-label="showPw ? t('auth.reset.hide') : t('auth.reset.show')" @click="showPw = !showPw"><component :is="showPw ? EyeOff : Eye" class="size-[18px]" :stroke-width="1.8" /></button>
            </div>
          </div>
          <p v-if="error" role="alert" class="bg-pink-soft text-pink-deep rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold">{{ error }}</p>
          <AppButton type="submit" :loading="loading" block><span class="inline-flex items-center gap-2">{{ t('auth.reset.save') }}<ArrowRight class="size-[18px]" :stroke-width="2.3" /></span></AppButton>
          <NuxtLink to="/login" class="inline-flex items-center justify-center gap-1.5 text-[14px] text-fg-muted hover:text-fg font-semibold transition-colors"><ArrowLeft class="size-[17px]" :stroke-width="2" />{{ t('auth.reset.backToLogin') }}</NuxtLink>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mode-forgot {
  background: linear-gradient(to bottom, var(--color-sky) 0%, var(--color-sky) 42%, var(--bg-card) 68%, var(--bg-card) 100%);
}
</style>
