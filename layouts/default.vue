<template>
  <div class="h-dvh w-screen flex flex-col overflow-hidden bg-base text-fg">
    <TheTopNav />
    <main class="relative flex-1 min-h-0 overflow-hidden">
      <slot />
    </main>
    <TheBottomNav />
    <MobileMoreSheet />
    <ClientOnly>
      <MascotFab />
    </ClientOnly>
  </div>
</template>
