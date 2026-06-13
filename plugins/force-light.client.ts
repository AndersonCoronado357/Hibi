// Hibi arranca SIEMPRE en claro: no seguir el modo oscuro del dispositivo.
// Migra una preferencia 'system' previa (de versiones anteriores) a 'light'.
export default defineNuxtPlugin(() => {
  const colorMode = useColorMode()
  if (colorMode.preference === 'system') {
    colorMode.preference = 'light'
  }
})
