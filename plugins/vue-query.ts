import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

// Estado de servidor (cloud-first). El persister en IndexedDB para offline
// se añade en la fase de "Offline + sync".
export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 min
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })
})
