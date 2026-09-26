/**
 * HeroTilt.jsx — lightweight, WebGL-free "3D depth" hero slide.
 *
 * Replaces the old Three.js viewer: an image with perspective tilt that
 * follows the pointer, a soft grounded shadow, and a floating caption.
 * No external 3D dependencies — pure CSS transforms, cheap to render.
 */
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/StoreContext'

export default function HeroTilt({ src, alt, brand, model, price, formatIDR, onQuick, children }) {
  const { t } = useStore()
  const wrapRef = useRef(null)
  const cardRef = useRef(null)
  const shadowRef = useRef(null)
  const [hover, setHover] = useState(false)

  /* pointer-driven tilt (written straight to the DOM — no re-renders) */
  const onMove = (e) => {
    const el = wrapRef.current
    const card = cardRef.current
    const shadow = shadowRef.current
    if (!el || !card) return
    const r = el.getBoundingClientRect()
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2 // -1..1
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2
    const ry = nx * 10 // rotateY
    const rx = -ny * 10 // rotateX
    card.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${hover ? 1.04 : 1.01})`
    if (shadow) {
      shadow.style.transform = `translate(${-nx * 18}px, ${10 + -ny * 6}px) scale(${hover ? 1.08 : 1})`
    }
  }
  const onLeave = () => {
    setHover(false)
    const card = cardRef.current
    const shadow = shadowRef.current
    if (card) card.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg) scale(1)'
    if (shadow) shadow.style.transform = 'translate(0px, 10px) scale(1)'
  }

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full cursor-grab select-none active:cursor-grabbing"
      onPointerMove={onMove}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={onLeave}
    >
      {/* grounded soft shadow (depth cue, sits under the card) */}
      <div
        ref={shadowRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-12 bottom-8 h-10 rounded-[50%] bg-ink/25 blur-xl transition-transform duration-200 ease-glide"
      />
      {/* the floating product card */}
      <div
        ref={cardRef}
        className="absolute inset-0 transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: 'perspective(1100px)' }}
      >
        {onQuick ? (
          <button
            type="button"
            onClick={onQuick}
            aria-label={`${brand} ${model}`}
            className="absolute inset-0"
          >
            <img
              src={src}
              alt={`${brand} ${model}`}
              className="h-full w-full object-contain p-6"
              draggable={false}
            />
          </button>
        ) : (
          <img
            src={src}
            alt={`${brand} ${model}`}
            className="h-full w-full object-contain p-6"
            draggable={false}
          />
        )}
        {children}
      </div>
      {/* floating caption for depth (higher z = "in front") */}
      {(brand || model || price) && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-card border border-line bg-raised/85 px-4 py-2.5 backdrop-blur"
          style={{ transform: 'translateZ(40px)' }}
        >
          {brand && <p className="label-mega">{brand}</p>}
          {model && <p className="font-serif text-lg font-semibold leading-tight">{model}</p>}
          {price != null && <p className="text-xs text-muted">{formatIDR(price)}</p>}
        </motion.div>
      )}
      {/* hover hint */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-4 top-4 z-10 rounded-card border border-line bg-raised/85 px-2.5 py-1 backdrop-blur"
      >
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-muted">
          {t('hero3d.hint')} · {t('hero3d.label')}
        </span>
      </div>
    </div>
  )
}
