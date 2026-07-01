// Mensajes del servidor traducidos según la cookie de idioma (hibi_lang).
// Se usa para los errores de auth que ve el usuario. Las claves que no estén
// en el catálogo se devuelven tal cual (así los mensajes ya escritos pasan).
import type { H3Event } from 'h3'

const MESSAGES: Record<string, { es: string; en: string }> = {
  badCredentials: { es: 'Correo o contraseña incorrectos', en: 'Wrong email or password' },
  emailTaken: { es: 'Ese correo ya tiene una cuenta. Inicia sesión.', en: 'That email already has an account. Sign in.' },
  notAuthenticated: { es: 'No autenticado', en: 'Not authenticated' },
  resetInvalid: { es: 'El enlace no es válido o ya venció', en: 'The link is invalid or has expired' },
  tooManyAttempts: { es: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.', en: 'Too many attempts. Wait a moment and try again.' },
  invalidData: { es: 'Datos inválidos', en: 'Invalid data' },
  nameRequired: { es: 'Escribe tu nombre', en: 'Enter your name' },
  emailInvalid: { es: 'Correo no válido', en: 'Invalid email' },
  emailRequired: { es: 'Escribe tu correo', en: 'Enter your email' },
  passwordRequired: { es: 'Escribe tu contraseña', en: 'Enter your password' },
  passwordTooShort: { es: 'La contraseña necesita al menos 6 caracteres', en: 'Password needs at least 6 characters' },
}

export function tServer(event: H3Event, key: string): string {
  const lang = getCookie(event, 'hibi_lang') === 'en' ? 'en' : 'es'
  const m = MESSAGES[key]
  return m ? m[lang] : key
}
