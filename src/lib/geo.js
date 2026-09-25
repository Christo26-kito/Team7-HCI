/**
 * geo.js — store metadata + lightweight geospatial helpers for the
 * GrabFood-style tracking simulation. All coordinates are DUMMY for the
 * Curug / Tangerang area (study project, no real geocoding).
 */

/* ---------- store metadata ---------- */
export const STORE = {
  name: 'SOLE⌁ARCHIVE — Curug Store',
  address: 'Jl. Taman Ubud III No.29, Binong, Kec. Curug, Kabupaten Tangerang, Banten 15810',
  // dummy coordinates around Curug, Tangerang
  lat: -6.3197,
  lng: 106.1387,
}

/* Known user drop-off points (dummy) keyed by city/postal code.
 * A real app would geocode the address; here we bucket by postal code. */
const USER_POINTS = [
  { label: 'Tangerang Kota', lat: -6.2127, lng: 106.605, match: ['151', '153', '154', 'tangerang kota'] },
  { label: 'Curug / Tangerang Selatan', lat: -6.3115, lng: 106.1271, match: ['158', 'curug'] },
  { label: 'Kelapa Dua', lat: -6.2605, lng: 106.585, match: ['155', 'kelapa dua'] },
  { label: 'Bintaro', lat: -6.2748, lng: 106.679, match: ['153', 'bintaro'] },
  { label: 'Serpong', lat: -6.3153, lng: 106.1787, match: ['152', 'serpong'] },
]

/** Pick a plausible user drop-off lat/lng from the checkout address fields. */
export function userPoint({ address = '', city = '', zip = '' } = {}) {
  const hay = `${address} ${city} ${zip}`.toLowerCase()
  const found = USER_POINTS.find(
    (p) =>
      p.match.some((m) => hay.includes(m)) ||
      (zip && zip.length >= 3 && p.match[0].startsWith(zip.slice(0, 3))),
  )
  if (found) return { ...found, lat: jitter(found.lat), lng: jitter(found.lng) }
  // fallback: random-ish offset near the store
  return { label: city || 'Lokasi Pengiriman', lat: jitter(STORE.lat + 0.012), lng: jitter(STORE.lng - 0.014) }
}

const jitter = (v) => v + (Math.random() - 0.5) * 0.002

/** Haversine distance in kilometres. */
export function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/**
 * Build a wobbly courier route (manhatten-ish) between two points.
 * Returns an array of {lat, lng} — ~12 segments, visually believable.
 */
export function buildRoute(a, b, seed = 1) {
  const pts = []
  const N = 12
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const lat = a.lat + (b.lat - a.lat) * t
    const lng = a.lng + (b.lng - a.lng) * t
    const wobble = Math.sin(t * Math.PI * 2.3 + seed) * 0.0016
    pts.push({ lat: lat + wobble, lng: lng - wobble })
  }
  return pts
}

/** Minutes estimate from distance (avg urban speed ~ 22 km/h) + handling time. */
export function etaMinutes(km) {
  const rideMin = (km / 22) * 60
  return Math.max(8, Math.round(rideMin + 6)) // +6 min picking from the store
}
