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
  currentRequired: { es: 'Escribe tu contraseña actual', en: 'Enter your current password' },
  newPasswordTooShort: { es: 'La nueva contraseña necesita al menos 8 caracteres', en: 'New password needs at least 8 characters' },
  wrongCurrentPassword: { es: 'La contraseña actual no es correcta', en: 'Current password is wrong' },
  noteNotFound: { es: 'Nota no encontrada', en: 'Note not found' },
  folderNotFound: { es: 'Carpeta no encontrada', en: 'Folder not found' },
  notFound: { es: 'No encontrado', en: 'Not found' },
  fileTooLarge: { es: 'El archivo es demasiado grande (máx. 20MB)', en: 'The file is too large (max 20MB)' },
  onlyImageAudioInline: { es: 'Solo imágenes o audio se pueden insertar en la nota', en: 'Only images or audio can be inserted in the note' },
  fileTypeNotAllowed: { es: 'Ese tipo de archivo no está permitido (solo imágenes, audio, video, pdf o texto)', en: 'That file type is not allowed (only images, audio, video, pdf or text)' },
}

export function tServer(event: H3Event, key: string): string {
  const lang = getCookie(event, 'hibi_lang') === 'en' ? 'en' : 'es'
  const m = MESSAGES[key]
  return m ? m[lang] : key
}
