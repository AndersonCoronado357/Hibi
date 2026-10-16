// Dibuja los cupones de regalo como PNG en un <canvas> y los deja listos para
// descargar. Se pintan a mano, con la paleta de Hibi fija en claro: el cupón se
// guarda y se comparte fuera de la app, así que no debe cambiar con el tema del
// teléfono.
//
// Forma de billete de verdad: tarjeta con muescas a los lados, troquel de
// puntos, talón a la derecha con la escultura dibujada, y el marco sembrado de
// nubes, estrellas y corazones.

export interface Cupon {
  /** Nombre del archivo que se descarga */
  archivo: string
  etiqueta: string
  titulo: string
  subtitulo: string
  /** Líneas de letra pequeña */
  detalle: string[]
  para: string
  acento: 'sky' | 'pink'
}

const C = {
  base: '#e9f2fb',
  card: '#ffffff',
  sky: '#a6d6f0',
  skySoft: '#d9edfa',
  skyDeep: '#5aa6d2',
  pink: '#f7c8d5',
  pinkSoft: '#fbe6ec',
  pinkDeep: '#db8aa3',
  mint: '#c6e9d6',
  lavender: '#dcd2f1',
  cream: '#fdf3e3',
  peach: '#ffd8c4',
  yellow: '#ffe6a8',
  fg: '#36465c',
  fgMuted: '#6f8197',
}

const FUENTE = '"M PLUS Rounded 1c", Quicksand, system-ui, sans-serif'
const W = 1200
const H = 700
const TALON = 318 // ancho del talón de la derecha

/** Generador determinista: el adorno del marco sale siempre igual. */
function prng(semilla: number) {
  let a = semilla
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Piezas sueltas de dibujo ────────────────────────────────────────────────

/** Estrella de 4 puntas con los lados hundidos, como la de la app. */
function chispa(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, giro = 0) {
  g.save()
  g.translate(x, y)
  g.rotate(giro)
  g.fillStyle = color
  const k = r * 0.14
  g.beginPath()
  g.moveTo(0, -r)
  g.quadraticCurveTo(k, -k, r, 0)
  g.quadraticCurveTo(k, k, 0, r)
  g.quadraticCurveTo(-k, k, -r, 0)
  g.quadraticCurveTo(-k, -k, 0, -r)
  g.fill()
  g.restore()
}

function corazon(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  g.save()
  g.translate(x, y)
  g.fillStyle = color
  g.beginPath()
  g.moveTo(0, r * 0.95)
  g.bezierCurveTo(-r * 1.4, -r * 0.2, -r * 0.55, -r * 1.15, 0, -r * 0.42)
  g.bezierCurveTo(r * 0.55, -r * 1.15, r * 1.4, -r * 0.2, 0, r * 0.95)
  g.fill()
  g.restore()
}

/** Nubecita de tres bultos. */
function nubecita(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  g.fillStyle = color
  for (const [dx, dy, dr] of [[-r * 0.8, r * 0.2, r * 0.7], [0, -r * 0.2, r], [r * 0.85, r * 0.25, r * 0.65]] as const) {
    g.beginPath()
    g.arc(x + dx, y + dy, dr, 0, Math.PI * 2)
    g.fill()
  }
}

/** La nube de Hibi con carita feliz, centrada en (cx, cy). */
function nubeHibi(g: CanvasRenderingContext2D, cx: number, cy: number, escala: number, cuerpo: string) {
  g.save()
  g.translate(cx, cy)
  g.scale(escala, escala)
  g.fillStyle = cuerpo
  for (const [x, y, r] of [[-40, 7, 30], [-15, -18, 30], [-10, 17, 30], [25, -8, 25], [45, 12, 25], [20, 22, 20]] as const) {
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = C.pink
  g.globalAlpha = 0.85
  for (const x of [-21, 17]) {
    g.beginPath()
    g.ellipse(x, 12, 4.6, 3, 0, 0, Math.PI * 2)
    g.fill()
  }
  g.globalAlpha = 1
  g.strokeStyle = C.skyDeep
  g.lineWidth = 2.4
  g.lineCap = 'round'
  for (const x of [-17, 5]) {
    g.beginPath()
    g.moveTo(x, 6)
    g.quadraticCurveTo(x + 5, 0, x + 10, 6)
    g.stroke()
  }
  g.fillStyle = C.skyDeep
  g.beginPath()
  g.moveTo(-9, 10)
  g.quadraticCurveTo(0, 18, 9, 10)
  g.closePath()
  g.fill()
  g.restore()
}

/**
 * Escultura de arcilla, plana y abstracta: peana, dos volúmenes redondos que se
 * solapan y un hueco, que es lo que hace que se lea como escultura moderna y no
 * como un muñeco de nieve.
 */
function escultura(g: CanvasRenderingContext2D, cx: number, cy: number, escala: number, fondo: string) {
  g.save()
  g.translate(cx, cy)
  g.scale(escala, escala)

  // Sombra plana en el suelo (un óvalo, sin desenfoque)
  g.fillStyle = C.cream
  g.beginPath()
  g.ellipse(0, 86, 74, 13, 0, 0, Math.PI * 2)
  g.fill()

  // Peana
  g.fillStyle = '#e8c3a6'
  g.beginPath()
  g.roundRect(-58, 62, 116, 24, 10)
  g.fill()

  // Cuerpo: volumen grande + volumen pequeño, unidos por un cuello
  g.fillStyle = C.peach
  g.beginPath()
  g.roundRect(-2, -34, 30, 60, 15)
  g.fill()
  g.beginPath()
  g.arc(-6, 22, 42, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.arc(16, -34, 29, 0, Math.PI * 2)
  g.fill()

  // Hueco: círculo del color del panel atravesando el volumen grande
  g.fillStyle = fondo
  g.beginPath()
  g.arc(-14, 26, 15, 0, Math.PI * 2)
  g.fill()

  // Brillo plano: un arco más claro en el borde de arriba a la izquierda
  g.strokeStyle = C.cream
  g.lineWidth = 7
  g.lineCap = 'round'
  g.beginPath()
  g.arc(-6, 22, 31, Math.PI * 1.06, Math.PI * 1.42)
  g.stroke()
  g.beginPath()
  g.arc(16, -34, 20, Math.PI * 1.04, Math.PI * 1.46)
  g.stroke()
  g.restore()
}

/** Línea de puntos, como el troquel de un cupón de papel. */
function troquel(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, grosor = 4) {
  g.save()
  g.strokeStyle = color
  g.lineWidth = grosor
  g.lineCap = 'round'
  g.setLineDash([2, 15])
  g.beginPath()
  g.moveTo(x1, y1)
  g.lineTo(x2, y2)
  g.stroke()
  g.restore()
}

/** Parte el texto para que quepa en `max` px. Devuelve el alto usado. */
function parrafo(g: CanvasRenderingContext2D, texto: string, x: number, y: number, max: number, alto: number): number {
  let linea = ''
  let cursor = y
  for (const p of texto.split(' ')) {
    const prueba = linea ? linea + ' ' + p : p
    if (g.measureText(prueba).width > max && linea) {
      g.fillText(linea, x, cursor)
      cursor += alto
      linea = p
    } else {
      linea = prueba
    }
  }
  if (linea) {
    g.fillText(linea, x, cursor)
    cursor += alto
  }
  return cursor - y
}

export function useCupones() {
  async function pngDeCupon(c: Cupon): Promise<Blob> {
    // Sin esto el canvas pinta con la tipografía de respaldo: el navegador no
    // carga una fuente solo porque se la nombre en canvas.
    try {
      await document.fonts.load(`800 62px ${FUENTE}`)
      await document.fonts.load(`700 26px ${FUENTE}`)
      await document.fonts.ready
    } catch { /* si falla, cae a la de respaldo y sigue */ }

    const lienzo = document.createElement('canvas')
    lienzo.width = W
    lienzo.height = H
    const g = lienzo.getContext('2d')!
    const acento = c.acento === 'pink' ? C.pinkDeep : C.skyDeep
    const suave = c.acento === 'pink' ? C.pinkSoft : C.skySoft
    const medio = c.acento === 'pink' ? C.pink : C.sky

    // ── Marco sembrado ────────────────────────────────────────────────────
    g.fillStyle = C.base
    g.fillRect(0, 0, W, H)

    const rnd = prng(c.acento === 'pink' ? 4042 : 2010)
    const paleta = [medio, C.mint, C.lavender, C.yellow, C.pink, acento]

    // Nubes grandes y suaves en las cuatro esquinas
    nubecita(g, 92, 96, 46, C.skySoft)
    nubecita(g, 1118, 92, 34, C.skySoft)
    nubecita(g, 76, 612, 36, C.skySoft)
    nubecita(g, 1110, 620, 44, C.skySoft)
    nubecita(g, 600, 26, 26, C.skySoft)
    nubecita(g, 520, 684, 30, C.skySoft)

    // Confeti por todo el marco. Se descarta lo que caiga sobre la tarjeta.
    const CXa = 76, CYa = 76
    for (let i = 0; i < 150; i++) {
      const x = 10 + rnd() * (W - 20)
      const y = 8 + rnd() * (H - 16)
      if (x > CXa - 10 && x < W - CXa + 10 && y > CYa - 10 && y < H - CYa + 10) continue
      const color = paleta[Math.floor(rnd() * paleta.length)]!
      const t = rnd()
      if (t < 0.40) chispa(g, x, y, 6 + rnd() * 9, color, rnd() * Math.PI)
      else if (t < 0.74) { g.fillStyle = color; g.beginPath(); g.arc(x, y, 3 + rnd() * 5, 0, Math.PI * 2); g.fill() }
      else corazon(g, x, y, 6 + rnd() * 6, color)
    }

    // ── Tarjeta ───────────────────────────────────────────────────────────
    const CX = 76, CY = 76, CW = W - 152, CH = H - 152
    g.fillStyle = C.card
    g.beginPath()
    g.roundRect(CX, CY, CW, CH, 44)
    g.fill()

    // Talón tintado: se lee como una parte aparte del billete
    const xTroquel = W - CX - TALON
    g.fillStyle = suave
    g.beginPath()
    g.roundRect(xTroquel, CY, W - CX - xTroquel, CH, [0, 44, 44, 0])
    g.fill()

    // Muescas del billete: dos círculos del color del fondo mordiendo los bordes
    g.fillStyle = C.base
    for (const y of [CY, CY + CH]) {
      g.beginPath()
      g.arc(xTroquel, y, 24, 0, Math.PI * 2)
      g.fill()
    }
    troquel(g, xTroquel, CY + 42, xTroquel, CY + CH - 42, C.card, 5)

    // Marco interior de puntos en la parte izquierda, con una chispa en cada esquina
    const fx = CX + 24, fy = CY + 24, fw = xTroquel - CX - 48, fh = CH - 48
    g.save()
    g.strokeStyle = suave
    g.lineWidth = 3
    g.setLineDash([2, 12])
    g.lineCap = 'round'
    g.beginPath()
    g.roundRect(fx, fy, fw, fh, 28)
    g.stroke()
    g.restore()
    for (const [sx, sy] of [[fx, fy], [fx + fw, fy], [fx, fy + fh], [fx + fw, fy + fh]] as const) {
      chispa(g, sx, sy, 9, medio)
    }

    // ── Lado izquierdo ────────────────────────────────────────────────────
    const X = CX + 62
    const MAX = xTroquel - X - 58

    g.font = `700 26px ${FUENTE}`
    const anchoPill = g.measureText(c.etiqueta).width + 44
    g.fillStyle = suave
    g.beginPath()
    g.roundRect(X, CY + 56, anchoPill, 50, 25)
    g.fill()
    g.fillStyle = acento
    g.textBaseline = 'middle'
    g.fillText(c.etiqueta, X + 22, CY + 82)
    chispa(g, X + anchoPill + 26, CY + 76, 11, medio)

    // Texto en flujo: cada bloque empieza donde acaba el anterior. Con
    // posiciones fijas, un subtítulo de dos líneas se montaba sobre el troquel.
    g.textBaseline = 'alphabetic'
    g.fillStyle = C.fg
    g.font = `800 62px ${FUENTE}`
    let cursor = CY + 186
    cursor += parrafo(g, c.titulo, X, cursor, MAX, 70)

    g.fillStyle = C.fgMuted
    g.font = `500 28px ${FUENTE}`
    cursor += 20
    cursor += parrafo(g, c.subtitulo, X, cursor, MAX, 38)

    // El troquel baja con el texto, pero nunca tanto como para empujar la
    // letra pequeña fuera de la tarjeta.
    const yRegla = Math.min(cursor + 28, CY + CH - 112)
    troquel(g, X, yRegla, xTroquel - 58, yRegla, suave)

    g.fillStyle = C.fgMuted
    g.font = `500 22px ${FUENTE}`
    let y = yRegla + 42
    for (const linea of c.detalle) {
      g.fillText(linea, X, y)
      y += 32
    }

    // ── Talón de la derecha ───────────────────────────────────────────────
    const TX = xTroquel + TALON / 2
    for (const [dx, dy, r] of [[-104, -34, 8], [96, -62, 10], [-92, 96, 7], [104, 72, 9]] as const) {
      chispa(g, TX + dx, TX * 0 + CY + 188 + dy, r, medio)
    }
    escultura(g, TX, CY + 188, 0.95, suave)

    g.textAlign = 'center'
    g.fillStyle = C.fgMuted
    g.font = `500 22px ${FUENTE}`
    g.fillText('Para', TX, CY + 348)
    g.fillStyle = acento
    g.font = `800 42px ${FUENTE}`
    g.fillText(c.para, TX, CY + 394)

    troquel(g, TX - 78, CY + 426, TX + 78, CY + 426, C.card, 3)

    nubeHibi(g, TX, CY + 482, 0.7, C.card)
    g.fillStyle = C.fgMuted
    g.font = `700 22px ${FUENTE}`
    g.fillText('Hibi', TX, CY + 536)
    g.textAlign = 'left'

    return await new Promise<Blob>((resolve, reject) => {
      lienzo.toBlob((b) => (b ? resolve(b) : reject(new Error('sin blob'))), 'image/png')
    })
  }

  async function descargar(c: Cupon): Promise<void> {
    const blob = await pngDeCupon(c)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = c.archivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Se revoca tarde: si se revoca de inmediato, algunos navegadores cancelan
    // la descarga antes de haberla escrito.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  return { pngDeCupon, descargar }
}
