import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Based on Aceternity UI "Placeholders And Vanish Input" (https://ui.aceternity.com),
 * adapted for Namma Mobiles:
 *  - styled with the app's theme tokens (light + dark) via .vsearch* classes in global.css
 *  - accessible: labelled input, decorative placeholder/canvas hidden from screen readers
 *  - `defaultValue`, `inputProps` (focus/keyboard/ARIA pass-through) and a leading `icon`
 *  - reduced motion: no rotating placeholder, no particle "vanish"
 *  - onSubmit(value) fires after the vanish animation has had time to play
 */
export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  defaultValue = '',
  label = 'Search',
  icon = null,
  inputProps = {},
  className,
}) {
  const reduceMotion = useReducedMotion()
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)
  const [value, setValue] = useState(defaultValue)
  const [animating, setAnimating] = useState(false)
  const canvasRef = useRef(null)
  const inputRef = useRef(null)
  const particlesRef = useRef([])

  // Rotate the example searches (paused while the tab is hidden, or when motion is reduced).
  useEffect(() => {
    if (reduceMotion || placeholders.length < 2) return undefined
    let id = null
    const start = () => {
      if (!id) id = setInterval(() => setCurrentPlaceholder((p) => (p + 1) % placeholders.length), 3000)
    }
    const stop = () => {
      clearInterval(id)
      id = null
    }
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop())
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [placeholders, reduceMotion])

  // Paint the current text onto an off-screen canvas and turn its pixels into particles.
  const draw = useCallback(() => {
    const input = inputRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!input || !ctx) return
    canvas.width = 800
    canvas.height = 800
    ctx.clearRect(0, 0, 800, 800)
    const styles = getComputedStyle(input)
    const fontSize = parseFloat(styles.getPropertyValue('font-size'))
    ctx.font = `${styles.fontWeight} ${fontSize * 2}px ${styles.fontFamily}`
    ctx.fillStyle = styles.color // theme-aware text colour (no invert filter needed)
    ctx.fillText(input.value, 16, 40)
    const { data } = ctx.getImageData(0, 0, 800, 800)
    const particles = []
    for (let y = 0; y < 800; y++) {
      for (let x = 0; x < 800; x++) {
        const i = 4 * (y * 800 + x)
        if (data[i + 3] > 0) {
          particles.push({ x, y, r: 1, color: `rgba(${data[i]}, ${data[i + 1]}, ${data[i + 2]}, ${data[i + 3] / 255})` })
        }
      }
    }
    particlesRef.current = particles
  }, [])

  const vanish = () => {
    const ctx = canvasRef.current?.getContext('2d')
    const startX = particlesRef.current.reduce((max, p) => Math.max(max, p.x), 0)
    const frame = (pos) => {
      requestAnimationFrame(() => {
        const next = []
        for (const p of particlesRef.current) {
          if (p.x < pos) {
            next.push(p)
          } else if (p.r > 0) {
            p.x += Math.random() > 0.5 ? 1 : -1
            p.y += Math.random() > 0.5 ? 1 : -1
            p.r -= 0.05 * Math.random()
            next.push(p)
          }
        }
        particlesRef.current = next
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800)
          for (const p of next) {
            if (p.x > pos) {
              ctx.beginPath()
              ctx.rect(p.x, p.y, p.r, p.r)
              ctx.fillStyle = p.color
              ctx.strokeStyle = p.color
              ctx.stroke()
            }
          }
        }
        if (next.length > 0) frame(pos - 8)
        else {
          setValue('')
          setAnimating(false)
        }
      })
    }
    frame(startX)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = (inputRef.current?.value || '').trim()
    if (!text || animating) return
    if (reduceMotion) {
      onSubmit?.(text)
      return
    }
    setAnimating(true)
    draw()
    vanish()
    setTimeout(() => onSubmit?.(text), 420) // let the vanish play before navigating
  }

  return (
    <form className={cn('vsearch', value && 'vsearch--filled', className)} onSubmit={handleSubmit} role="search">
      {icon && <span className="vsearch__icon" aria-hidden="true">{icon}</span>}
      <canvas ref={canvasRef} aria-hidden="true" className={cn('vsearch__canvas', animating && 'is-animating')} />
      <input
        ref={inputRef}
        type="search"
        value={value}
        aria-label={label}
        autoComplete="off"
        enterKeyHint="search"
        className={cn('vsearch__input', animating && 'is-animating')}
        {...inputProps}
        onChange={(e) => {
          if (animating) return
          setValue(e.target.value)
          onChange?.(e)
        }}
      />
      <button type="submit" className="vsearch__submit" disabled={!value} aria-label="Search">
        <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <motion.path
            d="M5 12l14 0"
            initial={{ strokeDasharray: '50%', strokeDashoffset: '50%' }}
            animate={{ strokeDashoffset: value ? 0 : '50%' }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </motion.svg>
      </button>
      <div className="vsearch__placeholder" aria-hidden="true">
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              key={`placeholder-${currentPlaceholder}`}
              initial={reduceMotion ? false : { y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { y: -15, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'linear' }}
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  )
}
