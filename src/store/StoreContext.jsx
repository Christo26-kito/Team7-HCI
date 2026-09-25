import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { dict } from '../i18n/dict'
import { PRODUCTS } from '../data/products'
import { setSoundEnabled } from '../lib/sound'
import * as auth from '../lib/auth'

const StoreContext = createContext(null)

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}

export function StoreProvider({ children }) {
  const [lang, setLang] = useState(() => read('sa-lang', 'id'))
  const [theme, setTheme] = useState(() => read('sa-theme', 'light'))
  const [soundOn, setSoundOn] = useState(() => read('sa-sound', true))
  const [query, setQuery] = useState('')
  const [quick, setQuick] = useState(null)
  const [cart, setCart] = useState(() =>
    read('sa-cart', []).filter((i) => PRODUCTS.some((p) => p.id === i.id && p.sizes.includes(i.size))),
  )
  const [promo, setPromo] = useState(null)
  const [cartBump, setCartBump] = useState(0)
  const [lastOrder, setLastOrder] = useState(null)
  const [kidsMode, setKidsMode] = useState(false)

  /* ---------- auth + per-user data ---------- */
  const [user, setUser] = useState(() => auth.getSession())
  const [favs, setFavs] = useState([])
  const [liked, setLiked] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    localStorage.setItem('sa-lang', JSON.stringify(lang))
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    localStorage.setItem('sa-theme', JSON.stringify(theme))
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    localStorage.setItem('sa-sound', JSON.stringify(soundOn))
    setSoundEnabled(soundOn)
  }, [soundOn])

  useEffect(() => {
    localStorage.setItem('sa-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (cart.length === 0 && promo) setPromo(null)
  }, [cart.length, promo])

  /* load favs/likes/orders when the signed-in user changes */
  useEffect(() => {
    const email = user ? user.email : null
    if (email) {
      setFavs(auth.loadFavs(email))
      setLiked(auth.loadLikes(email))
      setOrders(auth.loadOrders(email))
    } else {
      setFavs([])
      setLiked([])
      setOrders(auth.loadGuestOrders())
    }
  }, [user])

  const persistOrders = useCallback(
    (list) => {
      if (user) auth.saveOrders(user.email, list)
      else auth.saveGuestOrders(list)
    },
    [user],
  )
  const persistFavs = useCallback(
    (list) => {
      if (user) auth.saveFavs(user.email, list)
    },
    [user],
  )
  const persistLikes = useCallback(
    (list) => {
      if (user) auth.saveLikes(user.email, list)
    },
    [user],
  )

  const signup = useCallback(async (payload) => {
    const r = await auth.signup(payload)
    if (r.ok) setUser(r.user)
    return r
  }, [])

  const login = useCallback(async (email, pass, prefs) => {
    const r = await auth.login(email, pass, prefs)
    if (r.ok) setUser(r.user)
    return r
  }, [])

  const doLogout = useCallback(() => {
    auth.logout()
    setUser(null)
  }, [])

  const saveUserPrefs = useCallback((prefs) => {
    if (!user) return
    const updated = auth.savePrefs(prefs)
    setUser({ ...user, prefs: updated?.prefs || prefs })
  }, [user])

  const toggleFav = useCallback(
    (productId) => {
      setFavs((prev) => {
        const next = prev.includes(productId) ? prev.filter((x) => x !== productId) : [...prev, productId]
        persistFavs(next)
        return next
      })
    },
    [persistFavs],
  )

  const toggleLike = useCallback(
    (productId) => {
      setLiked((prev) => {
        const next = prev.includes(productId) ? prev.filter((x) => x !== productId) : [...prev, productId]
        persistLikes(next)
        return next
      })
    },
    [persistLikes],
  )

  /** Record a placed order. status: 'pending' | 'inprogress' | 'completed' */
  const placeOrder = useCallback(
    (order) => {
      const full = {
        ...order,
        status: order.status || 'pending',
        placedAt: Date.now(),
        paidAt: order.status === 'inprogress' || order.status === 'completed' ? Date.now() : null,
      }
      const next = [full, ...orders]
      setOrders(next)
      persistOrders(next)
      setLastOrder(full)
      return full
    },
    [orders, persistOrders],
  )

  /** Pay a pending order → 'inprogress' (courier picked up). */
  const payOrder = useCallback(
    (orderId) => {
      const next = orders.map((o) =>
        o.id === orderId ? { ...o, status: 'inprogress', paidAt: Date.now(), cancelled: false } : o,
      )
      setOrders(next)
      persistOrders(next)
    },
    [orders, persistOrders],
  )

  /** Cancel an order (returns items to cart if it was in-progress). */
  const cancelOrder = useCallback(
    (orderId) => {
      const next = orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled', cancelled: true } : o))
      setOrders(next)
      persistOrders(next)
    },
    [orders, persistOrders],
  )

  const t = useCallback((key) => dict[lang][key] ?? key, [lang])

  const addToCart = useCallback((productId, size, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === productId && i.size === size)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + qty }
        return next
      }
      return [...prev, { id: productId, size, qty }]
    })
    setCartBump((n) => n + 1)
  }, [])

  const setQty = useCallback((productId, size, qty) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => !(i.id === productId && i.size === size))
        : prev.map((i) => (i.id === productId && i.size === size ? { ...i, qty } : i)),
    )
  }, [])

  const removeItem = useCallback((productId, size) => {
    setCart((prev) => prev.filter((i) => !(i.id === productId && i.size === size)))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart])

  const cartDetailed = useMemo(
    () =>
      cart
        .map((i) => {
          const product = PRODUCTS.find((p) => p.id === i.id)
          return product ? { ...i, product } : null
        })
        .filter(Boolean),
    [cart],
  )

  const subtotal = useMemo(
    () => cartDetailed.reduce((s, i) => s + i.product.price * i.qty, 0),
    [cartDetailed],
  )
  const discount = useMemo(() => (promo ? Math.round(subtotal * promo.rate) : 0), [promo, subtotal])
  const shipping = useMemo(
    () => (cartDetailed.length === 0 || subtotal - discount >= 2000000 ? 0 : 25000),
    [cartDetailed.length, subtotal, discount],
  )
  const total = subtotal - discount + shipping

  const value = useMemo(
    () => ({
      lang,
      setLang,
      theme,
      toggleTheme: () => setTheme((v) => (v === 'dark' ? 'light' : 'dark')),
      soundOn,
      setSoundOn,
      query,
      setQuery,
      quick,
      setQuick,
      cart,
      cartDetailed,
      cartCount,
      cartBump,
      addToCart,
      setQty,
      removeItem,
      clearCart,
      promo,
      setPromo,
      subtotal,
      discount,
      shipping,
      total,
      lastOrder,
      setLastOrder,
      kidsMode,
      setKidsMode,
      t,
      user,
      signup,
      login,
      logout: doLogout,
      saveUserPrefs,
      favs,
      liked,
      toggleFav,
      toggleLike,
      orders,
      placeOrder,
      payOrder,
      cancelOrder,
    }),
    [
      lang,
      theme,
      soundOn,
      query,
      quick,
      cart,
      cartDetailed,
      cartCount,
      cartBump,
      addToCart,
      setQty,
      removeItem,
      clearCart,
      promo,
      subtotal,
      discount,
      shipping,
      total,
      lastOrder,
      kidsMode,
      setKidsMode,
      t,
      user,
      signup,
      login,
      doLogout,
      saveUserPrefs,
      favs,
      liked,
      toggleFav,
      toggleLike,
      orders,
      placeOrder,
      payOrder,
      cancelOrder,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
