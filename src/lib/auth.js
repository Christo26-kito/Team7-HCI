/**
 * auth.js — user accounts on localStorage (demo, no backend).
 *
 * Passwords are hashed with WebCrypto SHA-256 + a per-user salt.
 * To go real, swap these functions for API calls — the UI only uses
 * this module's async API.
 */

const USERS_KEY = 'sa-users-v1'
const SESSION_KEY = 'sa-session-v1'

const read = (k, f) => {
  try {
    const v = localStorage.getItem(k)
    return v === null ? f : JSON.parse(v)
  } catch {
    return f
  }
}
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
const newSalt = () => Math.random().toString(36).slice(2, 10)

/** @returns {Promise<{ok:boolean, user?:object, err?:string}>} */
export async function signup({ name, email, pass, prefs }) {
  const users = read(USERS_KEY, [])
  const cleanEmail = email.trim().toLowerCase()
  if (users.some((u) => u.email === cleanEmail)) return { ok: false, err: 'auth.err.taken' }

  const salt = newSalt()
  const hash = await hashPassword(pass, salt)
  const user = {
    id: cleanEmail,
    name: name.trim(),
    email: cleanEmail,
    salt,
    hash,
    prefs: prefs || {},
    createdAt: Date.now(),
  }
  users.push(user)
  write(USERS_KEY, users)
  write(SESSION_KEY, { email: cleanEmail, token: salt + hash.slice(0, 12), createdAt: Date.now() })
  return { ok: true, user: { id: user.id, name: user.name, email: user.email, prefs: user.prefs, createdAt: user.createdAt } }
}

/** @returns {Promise<{ok:boolean, user?:object, err?:string}>} */
export async function login(email, pass, prefs) {
  const users = read(USERS_KEY, [])
  const cleanEmail = email.trim().toLowerCase()
  const u = users.find((x) => x.email === cleanEmail)
  if (!u) return { ok: false, err: 'auth.err.noaccount' }
  const hash = await hashPassword(pass, u.salt)
  if (hash !== u.hash) return { ok: false, err: 'auth.err.bad' }
  // allow topping up prefs from the login form (onboarding)
  if (prefs && (prefs.brands?.length || prefs.categories?.length || prefs.colors?.length)) {
    u.prefs = { ...(u.prefs || {}), ...prefs }
    write(USERS_KEY, users)
  }
  write(SESSION_KEY, { email: cleanEmail, token: u.salt + hash.slice(0, 12), createdAt: Date.now() })
  return { ok: true, user: { id: u.id, name: u.name, email: u.email, prefs: u.prefs || {}, createdAt: u.createdAt } }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

/** @returns user object or null */
export function getSession() {
  const s = read(SESSION_KEY, null)
  if (!s) return null
  const u = read(USERS_KEY, []).find((x) => x.email === s.email)
  if (!u) return null
  return { id: u.id, name: u.name, email: u.email, prefs: u.prefs || {}, createdAt: u.createdAt }
}

export function savePrefs(prefs) {
  const s = read(SESSION_KEY, null)
  if (!s) return null
  const users = read(USERS_KEY, [])
  const u = users.find((x) => x.email === s.email)
  if (!u) return null
  u.prefs = prefs
  write(USERS_KEY, users)
  return { ...u, prefs }
}

/* ---------- per-user product interactions (favs / likes) ---------- */
export const loadFavs = (email) => read(`sa-favs-${email}`, [])
export const saveFavs = (email, favs) => write(`sa-favs-${email}`, favs)
export const loadLikes = (email) => read(`sa-likes-${email}`, [])
export const saveLikes = (email, liked) => write(`sa-likes-${email}`, liked)

/* ---------- orders ---------- */
export const loadOrders = (email) => read(`sa-orders-${email}`, [])
export const saveOrders = (email, orders) => write(`sa-orders-${email}`, orders)

// Guest orders (not signed in) so the flow still works without an account
export const loadGuestOrders = () => read('sa-guest-orders', [])
export const saveGuestOrders = (orders) => write('sa-guest-orders', orders)
