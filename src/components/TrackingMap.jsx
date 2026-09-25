/**
 * TrackingMap.jsx — Leaflet map with store pin + delivery pin, and a
 * courier marker animating along a simulated route (GrabFood-style).
 *
 * Leaflet is loaded from CDN at runtime (no build dependency); if the
 * CDN or map tiles fail, an inline SVG fallback map is rendered so the
 * page never breaks. Dark mode aware.
 */
import { useEffect, useRef, useState } from 'react'
import { STORE, userPoint, haversineKm, buildRoute, etaMinutes } from '../lib/geo'

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

let leafletPromise = null
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (leafletPromise) return leafletPromise
  leafletPromise = new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = LEAFLET_CSS
    document.head.appendChild(link)
    const s = document.createElement('script')
    s.src = LEAFLET_JS
    s.onload = () => resolve(window.L)
    s.onerror = () => {
      leafletPromise = null
      reject(new Error('leaflet cdn failed'))
    }
    document.head.appendChild(s)
  })
  return leafletPromise
}

export default function TrackingMap({ order, dark }) {
  const { t } = useStoreT()
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const courierRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const [progress, setProgress] = useState(0) // 0..1 along the route

  const start = useRef(
    order && order.status !== 'completed'
      ? {
          store: STORE,
          user: userPoint({ address: order.address, city: order.city, zip: order.zip }),
          route: [],
          eta: 0,
        }
      : null,
  )
  if (start.current) {
    const { store, user } = start.current
    start.current.route = buildRoute(store, user, (order.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0))
    start.current.eta = etaMinutes(haversineKm(store, user))
  }

  /* drive the courier along the route */
  useEffect(() => {
    if (!start.current || order.status === 'completed') {
      setProgress(1)
      return
    }
    const dur = Math.min(30, Math.max(12, start.current.eta)) * 1000 // demo: compressed to ≤ 30 s
    const t0 = Date.now()
    let id
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / dur)
      setProgress(p)
      placeCourier(p)
      if (p < 1) id = setTimeout(tick, 200)
    }
    tick()
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id, order.status])

  const placeCourier = (p) => {
    const L = window.L
    if (!L || !mapRef.current || !courierRef.current) return
    const pts = start.current.route
    const idx = p * (pts.length - 1)
    const i = Math.floor(idx)
    const f = idx - i
    const a = pts[i]
    const b = pts[Math.min(i + 1, pts.length - 1)]
    courierRef.current.setLatLng([a.lat + (b.lat - a.lat) * f, a.lng + (b.lng - a.lng) * f])
  }

  /* init the map once */
  useEffect(() => {
    let cancelled = false
    if (!start.current) return
    loadLeaflet()
      .then((L) => {
        if (cancelled || !elRef.current) return
        const { store, user, route } = start.current
        const map = L.map(elRef.current, { scrollWheelZoom: false, zoomControl: true }).setView(
          [(store.lat + user.lat) / 2, (store.lng + user.lng) / 2],
          14,
        )
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          className: dark ? 'tk-dark' : '',
        }).addTo(map)

        const icon = (color, label) =>
          L.divIcon({
            html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
              <div style="width:26px;height:26px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>
              <div style="font:600 10px/1 system-ui;color:${dark ? '#E9ECF2' : '#12151A'};background:rgba(255,255,255,.85);border-radius:4px;padding:2px 5px">${label}</div>
            </div>`,
            iconSize: [26, 44],
            iconAnchor: [13, 40],
          })

        L.marker([store.lat, store.lng], { icon: icon('#12151A', t('track.store')) }).addTo(map)
        L.marker([user.lat, user.lng], { icon: icon('#3F8F6B', t('track.user')) }).addTo(map)
        L.polyline(route.map((p) => [p.lat, p.lng]), { color: '#5F6B7C', weight: 3, dashArray: '6 8', opacity: 0.7 }).addTo(map)
        const courier = L.marker([route[0].lat, route[0].lng], { icon: icon('#E8A33D', t('track.courier')), zIndexOffset: 500 }).addTo(map)
        map.fitBounds(L.latLngBounds([route[0], route[route.length - 1]]).pad(0.25))
        mapRef.current = map
        courierRef.current = courier
        placeCourier(progressRef.current)
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const progressRef = useRef(0)
  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  const stage = progress < 0.33 ? 'preparing' : progress < 0.999 ? 'onway' : 'arrived'
  const leftMin = Math.max(0, Math.ceil((1 - progress) * start.current?.eta))

  return (
    <div>
      {/* stage timeline */}
      <ol className="flex items-center justify-between gap-2">
        {[
          ['preparing', t('track.stPreparing')],
          ['onway', t('track.stOnway')],
          ['arrived', t('track.stArrived')],
        ].map(([k, label], i) => {
          const done = stage === 'arrived' || (k === 'preparing' && progress >= 0.33) || (k === 'onway' && stage === 'arrived')
          return (
            <li key={k} className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border font-display text-xs font-bold transition-all duration-500 ${
                  done ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-muted'
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-[11px] font-semibold ${done ? 'text-ink' : 'text-muted'}`}>{label}</span>
            </li>
          )
        })}
      </ol>

      <div className="relative mt-4 h-72 overflow-hidden rounded-card border border-line sm:h-80">
        {failed ? (
          <FallbackMap failed={true} order={order} />
        ) : (
          <div ref={elRef} className="h-full w-full bg-raised" aria-label="Peta pelacakan" role="img" />
        )}

        {/* ETA overlay */}
        <div className="pointer-events-none absolute left-4 top-4 rounded-card border border-line bg-raised/90 px-4 py-3 backdrop-blur">
          <p className="label-mega">{t('track.eta')}</p>
          <p className="font-display text-2xl font-extrabold tabular-nums">
            {progress >= 1 ? t('track.etaNow') : `${leftMin} ${t('track.etaMin')}`}
          </p>
        </div>
        {/* progress bar */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-line">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

/* Tiny inline fallback if Leaflet CDN/tiles are unreachable. */
function FallbackMap({ order }) {
  const { t } = useStoreT()
  const from = STORE
  const to = userPoint({ address: order?.address, city: order?.city, zip: order?.zip })
  const w = 400
  const h = 200
  const px = (lng) => ((lng - from.lng) / (to.lng - from.lng || 0.001)) * (w - 80) + 40
  const py = (lat) => h - ((lat - from.lat) / (to.lat - from.lat || -0.001)) * (h - 60) - 20
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-raised p-4 text-center">
      <svg viewBox={`0 0 ${w} ${h}`} className="max-w-full" aria-hidden>
        <line x1={px(from.lng)} y1={py(from.lat)} x2={px(to.lng)} y2={py(to.lat)} stroke="var(--c-accent-rgb)" strokeDasharray="6 6" strokeWidth="2" opacity="0.6" />
        <circle cx={px(from.lng)} cy={py(from.lat)} r="7" fill="rgb(var(--c-ink-rgb))" />
        <circle cx={px(to.lng)} cy={py(to.lat)} r="7" fill="rgb(var(--c-ok-rgb))" />
        <text x={px(from.lng)} y={py(from.lat) - 12} textAnchor="middle" fontSize="10" fill="currentColor">{t('track.store')}</text>
        <text x={px(to.lng)} y={py(to.lat) - 12} textAnchor="middle" fontSize="10" fill="currentColor">{t('track.user')}</text>
      </svg>
      <p className="max-w-md text-xs text-muted">
        {from.address}
      </p>
    </div>
  )
}

/* local helper so the component stays import-free of the store at module load */
import { useStore } from '../store/StoreContext'
function useStoreT() {
  const { t, theme } = useStore()
  return { t, dark: theme === 'dark' }
}
