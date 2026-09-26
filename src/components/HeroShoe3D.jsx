/**
 * HeroShoe3D.jsx — interactive 3D showcase slide for the hero slideshow.
 *
 * Loads a real low-poly sneaker model (glTF, bundled under /public/models)
 * and renders it with Three.js: drag to rotate 360°, scroll to zoom, and
 * switch between three baked colorway textures (Midnight / Beach / Street).
 * The model loads from the app's own assets, so there is no CDN or network
 * dependency. If WebGL or the model fails to load, a static product image
 * renders instead so the slideshow never breaks. All interaction happens
 * inside the canvas — the slideshow's arrows/dots sit outside it, so slider
 * navigation is untouched.
 */
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/StoreContext'
import { img, PRODUCTS } from '../data/products'

/* Colorways: the model ships with three baked texture variants */
const COLORWAYS = {
  midnight: { texture: 'diffuseMidnight.jpg', chip: '#2b2f38', label: { id: 'Midnight', en: 'Midnight' } },
  beach: { texture: 'diffuseBeach.jpg', chip: '#e8d9c4', label: { id: 'Beach', en: 'Beach' } },
  street: { texture: 'diffuseStreet.jpg', chip: '#8b93a1', label: { id: 'Street', en: 'Street' } },
}

export default function HeroShoe3D({ fallbackSrc }) {
  const { t, lang, setQuick } = useStore()
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [cw, setCw] = useState('midnight')
  const texCache = useRef({})
  const applyRef = useRef(null)
  const heroProduct = PRODUCTS.find((p) => p.id === 'airmax90')

  useEffect(() => {
    let disposed = false
    let raf = 0

    const mount = async () => {
      let THREE, OrbitControls, GLTFLoader
      try {
        THREE = await import('three')
        ;({ OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js'))
        ;({ GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js'))
      } catch {
        setFailed(true)
        return
      }
      if (disposed || !canvasRef.current) return

      const canvas = canvasRef.current
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
      camera.position.set(0, 0.25, 3.3)

      /* ---------- lights (soft studio) ---------- */
      scene.add(new THREE.HemisphereLight(0xe9ecf2, 0x0a0d14, 1.1))
      const key = new THREE.DirectionalLight(0xffffff, 2.2)
      key.position.set(4, 6, 5)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0x9aa4b5, 1.2)
      rim.position.set(-5, 3, -4)
      scene.add(rim)

      /* ---------- pedestal disc ---------- */
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 0.1, 48),
        new THREE.MeshStandardMaterial({ color: 0xdfe2e4, roughness: 0.95 }),
      )
      disc.position.y = -1.06
      scene.add(disc)

      /* ---------- lazy texture loader for the colorway variants ---------- */
      const texLoader = new THREE.TextureLoader()
      const loadTex = (name) => {
        if (texCache.current[name]) return Promise.resolve(texCache.current[name])
        return new Promise((res) =>
          texLoader.load(`${import.meta.env.BASE_URL}models/${name}`, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace
            tex.anisotropy = 4
            texCache.current[name] = tex
            res(tex)
          }),
        )
      }

      /* ---------- load the real sneaker model (local asset) ---------- */
      const loader = new GLTFLoader()
      const modelUrl = `${import.meta.env.BASE_URL}models/MaterialsVariantsShoe.gltf`
      loader.load(
        modelUrl,
        (gltf) => {
          if (disposed || !canvasRef.current) return
          const shoe = gltf.scene
          shoe.rotation.y = -0.6
          scene.add(shoe)

          /* normalise: scale the real model to a known size, re-centre on the
             origin so the camera framing is exact regardless of the asset's
             native scale/offset */
          shoe.updateMatrixWorld(true)
          const fitBox = new THREE.Box3().setFromObject(shoe)
          const fitSize = fitBox.getSize(new THREE.Vector3())
          const fitCenter = fitBox.getCenter(new THREE.Vector3())
          const s = 1.5 / Math.max(fitSize.x, fitSize.y, fitSize.z)
          shoe.scale.setScalar(s)
          shoe.position.sub(fitCenter.multiplyScalar(s))
          const homeY = shoe.position.y + 0.12 // lift slightly so it sits visually centred

          /* seat the pedestal disc right under the shoe's soles */
          const seatedBox = new THREE.Box3().setFromObject(shoe)
          disc.position.y = seatedBox.min.y - 0.08
          disc.scale.setScalar((seatedBox.max.x - seatedBox.min.x) * 0.55)
          // give the disc a bit more contrast so it reads as a pedestal
          disc.material.color.set(0xb9bec7)

          /* orbit controls: drag rotate 360° + scroll zoom, no panning */
          const controls = new OrbitControls(camera, canvas)
          controls.enablePan = false
          controls.enableDamping = true
          controls.dampingFactor = 0.08
          controls.minDistance = 2.4
          controls.maxDistance = 5.5
          controls.minPolarAngle = 0.35
          controls.maxPolarAngle = 1.65
          controls.autoRotate = true
          controls.autoRotateSpeed = 0.9
          controls.target.set(0, 0, 0)
          controls.update()

          /* apply a colorway texture to the shoe's materials */
          applyRef.current = (key) => {
            loadTex(COLORWAYS[key].texture).then((tex) => {
              if (!tex) return
              shoe.traverse((o) => {
                if (o.isMesh) {
                  const mats = Array.isArray(o.material) ? o.material : [o.material]
                  for (const m of mats) {
                    if (m && m.map !== undefined) {
                      m.map = tex
                      m.needsUpdate = true
                    }
                  }
                }
              })
            })
          }
          applyRef.current('midnight')

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
          let dragging = false
          const onDown = () => {
            dragging = true
            controls.autoRotate = false
          }
          const onUp = () => {
            dragging = false
          }
          canvas.addEventListener('pointerdown', onDown)
          window.addEventListener('pointerup', onUp)

          const clock = new THREE.Clock()
          const loop = () => {
            if (disposed) return
            raf = requestAnimationFrame(loop)
            const el = clock.getElapsedTime()
            if (!dragging) controls.autoRotate = true
            controls.update()
            shoe.position.y = homeY + Math.sin(el * 1.1) * 0.06 // soft float
            renderer.render(scene, camera)
          }
          loop()
          setReady(true)

          return () => {
            disposed = true
            cancelAnimationFrame(raf)
            ro.disconnect()
            canvas.removeEventListener('pointerdown', onDown)
            window.removeEventListener('pointerup', onUp)
          }
        },
        undefined,
        () => {
          if (!disposed) setFailed(true)
        },
      )
    }

    const cleanup = mount()
    return () => {
      if (cleanup instanceof Promise) cleanup.catch(() => {})
    }
  }, [])

  /* swap the baked colorway texture when a swatch is picked */
  useEffect(() => {
    if (!ready) return
    applyRef.current?.(cw)
  }, [cw, ready])

  /* WebGL / model failure → static image so the slide keeps working */
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
      <p className="pointer-events-none absolute bottom-9 left-1/2 w-max -translate-x-1/2 text-center text-[10px] font-medium uppercase tracking-wider text-muted">
        {t('hero3d.hint')}
      </p>

      {/* colorway swatches */}
      {ready && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {Object.entries(COLORWAYS).map(([k, c]) => (
            <button
              key={k}
              onClick={() => setCw(k)}
              title={c.label[lang]}
              aria-label={c.label[lang]}
              className={`h-5 w-5 rounded-full border-2 transition-all duration-300 ${
                cw === k ? 'scale-110 border-ink ring-2 ring-ink/30' : 'border-line/60 hover:scale-105'
              }`}
              style={{ background: c.chip }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
