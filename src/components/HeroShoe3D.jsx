/**
 * HeroShoe3D.jsx — interactive 3D showcase slide for the hero slideshow.
 *
 * A stylised low-poly sneaker is built procedurally with Three.js
 * primitives (no external .glb needed, fully self-contained). The user can
 * drag to rotate 360° and scroll to zoom. Three.js is lazy-imported from a
 * CDN; if the network/CDN fails, a static product image renders instead so
 * the slideshow never breaks. All interaction happens inside the canvas —
 * the slideshow's arrows/dots sit outside it, so slider navigation is
 * untouched.
 */
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/StoreContext'
import { img, PRODUCTS } from '../data/products'

const THREE_CDN = 'https://unpkg.com/three@0.160.0/build/three.module.js'

/* Brand palette (hex) */
const C = {
  ink: 0x12151a,
  raised: 0x1a1d24,
  bone: 0xcfc7ba,
  accent: 0x5f6b7c,
  cream: 0xefe8da,
  clay: 0xa4553c,
  ok: 0x3f8f6b,
}

export default function HeroShoe3D({ fallbackSrc }) {
  const { t, theme, setQuick } = useStore()
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const heroProduct = PRODUCTS.find((p) => p.id === 'airmax90')

  useEffect(() => {
    let disposed = false
    let raf = 0

    const mount = async () => {
      let THREE
      try {
        THREE = await import(/* @vite-ignore */ THREE_CDN)
      } catch {
        setFailed(true)
        return
      }
      if (disposed || !canvasRef.current) return

      const canvas = canvasRef.current
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
      camera.position.set(0, 1.4, 7)

      /* ---------- lights (soft studio) ---------- */
      scene.add(new THREE.HemisphereLight(0xe9ecf2, 0x0a0d14, 0.9))
      const key = new THREE.DirectionalLight(0xffffff, 1.6)
      key.position.set(4, 6, 5)
      scene.add(key)
      const rim = new THREE.DirectionalLight(C.accent, 0.8)
      rim.position.set(-5, 3, -4)
      scene.add(rim)

      /* ---------- the shoe (procedural, stylised) ---------- */
      const shoe = new THREE.Group()
      const mat = (color, rough = 0.55) =>
        new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.08 })

      // sole
      const sole = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.55, 1.7), mat(C.ink, 0.85))
      sole.position.y = -0.55
      sole.geometry.translate(0, 0, 0)
      // rounded sole via scaling a cylinder cross: use scaled box + bevel illusion
      shoe.add(sole)

      // midsole wedge (accent line)
      const mid = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.28, 1.55), mat(C.accent, 0.5))
      mid.position.y = -0.24
      shoe.add(mid)

      // upper body
      const upper = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), mat(C.bone, 0.7))
      upper.scale.set(2.1, 0.85, 0.82)
      upper.position.set(-0.15, 0.45, 0)
      shoe.add(upper)

      // toe
      const toe = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), mat(C.cream, 0.65))
      toe.scale.set(1.15, 0.62, 0.78)
      toe.position.set(1.75, 0.12, 0)
      shoe.add(toe)

      // heel collar
      const heel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 1.1, 20), mat(C.clay, 0.7))
      heel.position.set(-1.95, 0.55, 0)
      heel.rotation.z = 0.12
      shoe.add(heel)

      // tongue
      const tongue = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.9), mat(C.cream, 0.7))
      tongue.position.set(0.35, 1.05, 0)
      tongue.rotation.z = -0.18
      shoe.add(tongue)

      // laces
      for (let i = 0; i < 4; i++) {
        const lace = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), mat(0x2a2e35, 0.4))
        lace.rotation.z = Math.PI / 2
        lace.rotation.y = 0.28
        lace.position.set(0.15 + i * 0.42, 0.85 + i * 0.09, 0)
        shoe.add(lace)
      }

      // side stripe (brand mark)
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.05), mat(C.accent, 0.4))
      stripe.position.set(-0.5, 0.15, 0.86)
      shoe.add(stripe)
      const stripe2 = stripe.clone()
      stripe2.position.z = -0.86
      shoe.add(stripe2)

      shoe.rotation.y = -0.6
      scene.add(shoe)

      // pedestal disc
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.12, 48), mat(theme === 'dark' ? 0x161d27 : 0xe9ebec, 0.9))
      disc.position.y = -0.85
      scene.add(disc)

      // floating "archive" particles
      const pGeo = new THREE.BufferGeometry()
      const N = 90
      const pos = new Float32Array(N * 3)
      for (let i = 0; i < N; i++) {
        const r = 3.4 + Math.random() * 2.2
        const a = Math.random() * Math.PI * 2
        const y = (Math.random() - 0.5) * 3.4
        pos[i * 3] = Math.cos(a) * r
        pos[i * 3 + 1] = y
        pos[i * 3 + 2] = Math.sin(a) * r
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const pts = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ color: C.accent, size: 0.045, transparent: true, opacity: 0.55 }),
      )
      scene.add(pts)

      /* ---------- interaction: drag rotate + wheel zoom ---------- */
      let dragging = false
      let px = 0
      let py = 0
      let velX = 0.004 // idle auto-rotation
      let velY = 0
      let zoom = 7

      const onDown = (e) => {
        dragging = true
        px = e.clientX
        py = e.clientY
        velX = 0
      }
      const onMove = (e) => {
        if (!dragging) return
        const dx = e.clientX - px
        const dy = e.clientY - py
        px = e.clientX
        py = e.clientY
        velX = -dx * 0.005
        velY = -dy * 0.003
        shoe.rotation.y += velX
        shoe.rotation.x = Math.max(-0.5, Math.min(0.5, shoe.rotation.x + velY))
      }
      const onUp = () => {
        dragging = false
      }
      const onWheel = (e) => {
        e.preventDefault()
        zoom = Math.max(4.5, Math.min(10, zoom + e.deltaY * 0.005))
      }
      canvas.addEventListener('pointerdown', onDown)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      canvas.addEventListener('wheel', onWheel, { passive: false })

      /* ---------- resize ---------- */
      const fit = () => {
        const w = wrapRef.current?.clientWidth || 480
        const h = wrapRef.current?.clientHeight || 480
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      fit()
      const ro = new ResizeObserver(fit)
      if (wrapRef.current) ro.observe(wrapRef.current)

      /* ---------- loop ---------- */
      const clock = new THREE.Clock()
      const loop = () => {
        if (disposed) return
        raf = requestAnimationFrame(loop)
        const el = clock.getElapsedTime()
        if (!dragging) {
          shoe.rotation.y += 0.004 // gentle auto-rotate
          shoe.rotation.x *= 0.94 // settle back to level
        }
        shoe.position.y = Math.sin(el * 1.2) * 0.08 // soft float
        pts.rotation.y = el * 0.05
        camera.position.z += (zoom - camera.position.z) * 0.08
        camera.lookAt(0, 0.2, 0)
        renderer.render(scene, camera)
      }
      loop()
      setReady(true)

      return () => {
        disposed = true
        cancelAnimationFrame(raf)
        ro.disconnect()
        canvas.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        canvas.removeEventListener('wheel', onWheel)
        renderer.dispose()
      }
    }

    const cleanup = mount()
    return () => {
      if (cleanup instanceof Promise) cleanup.catch(() => {})
    }
  }, [])

  /* CDN / WebGL failure → static image so the slide keeps working */
  if (failed) {
    return (
      <img
        src={fallbackSrc || img('/images/hero.png')}
        alt="Sole Archive — showcase"
        className="h-full w-full object-contain"
      />
    )
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full select-none" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        aria-label={t('hero3d.label')}
        onDoubleClick={() => heroProduct && setQuick(heroProduct)}
      />
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-card border border-line bg-raised/80 px-3 py-1.5 backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-ok" />
        <span className="label-mega !text-ink">{t('hero3d.label')}</span>
      </div>
      <p className="pointer-events-none absolute bottom-3 left-1/2 w-max -translate-x-1/2 text-center text-[10px] font-medium uppercase tracking-wider text-muted">
        {t('hero3d.hint')}
      </p>
    </div>
  )
}
