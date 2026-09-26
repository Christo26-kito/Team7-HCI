import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/StoreContext'
import { PRODUCTS, formatIDR } from '../data/products'
import { sfx } from '../lib/sound'
import { GLIDE, SETTLE } from './Reveal'

const IconSearch = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)
const IconBag = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M6 8h12l-1 12H7L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
)
const IconSun = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)
const IconMoon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </svg>
)
const IconSoundOn = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 10v4h3l4 3V7l-4 3H4Z" />
    <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" />
  </svg>
)
const IconSoundOff = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 10v4h3l4 3V7l-4 3H4Z" />
    <path d="m16 10 4 4M20 10l-4 4" />
  </svg>
)
const IconInstagram = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" />
  </svg>
)
const IconTikTok = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M16.6 3c.4 2.1 1.8 3.6 3.9 3.9v2.9c-1.5 0-2.9-.5-3.9-1.3v6.1c0 3.6-2.6 6.4-6.2 6.4S4 18.2 4 14.6c0-3.5 2.7-6.3 6.2-6.3.4 0 .7 0 1 .1v3a3.3 3.3 0 0 0-1-.2 3.4 3.4 0 1 0 3.4 3.4V3h3Z" />
  </svg>
)
const IconX = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M17.5 3h3l-6.6 7.6L21.8 21h-6l-4.7-6.1L5.7 21h-3l7-8.1L2.5 3h6.2l4.2 5.6L17.5 3Zm-1 16h1.7L7.8 4.7H6L16.5 19Z" />
  </svg>
)

export default function Navbar() {
  const { t, lang, setLang, theme, toggleTheme, soundOn, setSoundOn, query, setQuery, setQuick, cartCount, cartBump, user } =
    useStore()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [condensed, setCondensed] = useState(false)
  const [searchHidden, setSearchHidden] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (v) => setCondensed(v > 32))

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - last
      last = y
      if (Math.abs(delta) < 6) return
      if (delta > 0 && y > 140) setSearchHidden(true)
      else if (delta < 0) setSearchHidden(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const hideSearch = searchHidden || !isHome

  /* ---------- live product search ---------- */
  const headerRef = useRef(null)
  const [searchFocused, setSearchFocused] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const rank = (p) => {
      const brand = p.brand.toLowerCase()
      const model = p.model.toLowerCase()
      if (model.startsWith(q)) return 0
      if (brand.startsWith(q)) return 1
      if (model.includes(q)) return 2
      if (brand.includes(q)) return 3
      if (p.colorway.toLowerCase().includes(q)) return 4
      return -1
    }
    return PRODUCTS.map((p) => ({ p, r: rank(p) }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => a.r - b.r || b.p.likes - a.p.likes)
      .map((x) => x.p)
  }, [query])

  const showResults = searchFocused && !hideSearch && query.trim().length > 0

  useEffect(() => {
    if (!searchFocused) return
    const onPointerDown = (e) => {
      if (!headerRef.current?.contains(e.target)) setSearchFocused(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSearchFocused(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [searchFocused])

  const openProduct = (p) => {
    setSearchFocused(false)
    setQuick(p)
    sfx.tap()
  }

  const viewAllMatches = () => {
    setSearchFocused(false)
    document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const goHome = (e) => {
    if (isHome) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const searchBox = (hidden, id) => (
    <div className="relative w-full">
      <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setSearchFocused(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) openProduct(matches[0])
        }}
        placeholder={t('nav.search')}
        aria-label={t('nav.search')}
        aria-expanded={showResults}
        aria-controls={`search-results-${id}`}
        autoComplete="off"
        tabIndex={hidden ? -1 : 0}
        className="field !py-2.5 pl-10 pr-4 text-sm"
      />

      <AnimatePresence>
        {showResults && (
          <motion.div
            id={`search-results-${id}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: GLIDE }}
            className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50"
          >
            <div className="overflow-hidden rounded-card border border-line bg-surface shadow-pop">
              {matches.length === 0 ? (
                <p className="px-4 py-5 text-sm text-muted">{t('search.empty')}</p>
              ) : (
                <>
                  <p className="label-mega border-b border-line-soft px-4 py-2.5">
                    {matches.length} {t('filter.results')}
                  </p>
                  <ul className="max-h-[55vh] overflow-y-auto py-1">
                    {matches.slice(0, 6).map((p) => (
                      <li key={p.id}>
                        <button
                          onClick={() => openProduct(p)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-200 hover:bg-raised"
                        >
                          <span className="img-tile h-11 w-11 shrink-0">
                            <img src={p.image} alt={p.model} loading="lazy" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="label-mega block">{p.brand}</span>
                            <span className="block truncate font-display text-sm font-semibold">{p.model}</span>
                          </span>
                          <span className="shrink-0 font-display text-xs font-bold">{formatIDR(p.price)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={viewAllMatches}
                    className="flex w-full items-center justify-between border-t border-line-soft px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-accent transition-colors duration-200 hover:bg-raised"
                  >
                    {t('search.viewAll')}
                    <span aria-hidden>→</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md transition-shadow duration-500 ease-glide ${
        condensed ? 'shadow-lift' : ''
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center gap-4 px-4 transition-all duration-500 ease-glide sm:px-6 lg:px-8 ${
          condensed ? 'h-14' : 'h-16'
        }`}
      >
        <Link to="/" onClick={goHome} className="group flex shrink-0 items-baseline gap-1 font-display text-lg font-extrabold tracking-tight">
          <span>SOLE</span>
          <motion.span
            className="text-accent"
            whileHover={{ rotate: 180 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            ⌁
          </motion.span>
          <span className="hidden sm:inline">ARCHIVE</span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <div
            className={`w-full transition-all duration-500 ease-glide ${
              hideSearch ? 'pointer-events-none max-w-0 overflow-hidden opacity-0' : 'max-w-md opacity-100'
            }`}
          >
            {searchBox(hideSearch, 'desktop')}
          </div>
        </div>

        <div
          className={`ml-auto flex items-center gap-1.5 transition-all duration-500 ease-glide sm:gap-2 ${
            searchHidden ? 'pointer-events-none max-w-0 overflow-hidden opacity-0' : 'max-w-full opacity-100'
          }`}
        >
          {/* Language toggle */}
          <button
            onClick={() => {
              setLang(lang === 'id' ? 'en' : 'id')
              sfx.tap()
            }}
            aria-label={t('nav.lang')}
            className="rounded-card border border-line px-2.5 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-muted transition-all duration-300 ease-glide hover:border-accent hover:text-ink"
          >
            {lang === 'id' ? 'ID' : 'EN'}
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn(!soundOn)}
            aria-label={t('nav.sound')}
            title={t('nav.sound')}
            className="hidden rounded-card border border-line p-2 text-muted transition-all duration-300 ease-glide hover:border-accent hover:text-ink sm:block"
          >
            {soundOn ? <IconSoundOn className="h-4 w-4" /> : <IconSoundOff className="h-4 w-4" />}
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => {
              toggleTheme()
              sfx.tap()
            }}
            aria-label={t('nav.theme')}
            title={t('nav.theme')}
            className="rounded-card border border-line p-2 text-muted transition-all duration-300 ease-glide hover:border-accent hover:text-ink"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.3, ease: GLIDE }}
                className="block"
              >
                {theme === 'dark' ? <IconMoon className="h-4 w-4" /> : <IconSun className="h-4 w-4" />}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* Follow us */}
          <div className="hidden items-center gap-1 border-l border-line pl-2 lg:flex" title={t('nav.follow')}>
            {[IconInstagram, IconTikTok, IconX].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-label={t('nav.follow')}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="rounded-card p-1.5 text-muted transition-colors duration-300 hover:text-ink"
              >
                <Icon className="h-4 w-4" />
              </motion.a>
            ))}
          </div>

          {/* Account */}
          <Link
            to={user ? '/account' : '/login'}
            aria-label={user ? t('dash.title') : t('auth.login')}
            title={user ? `${user.name}` : t('auth.login')}
            className={`relative hidden rounded-card border p-2 transition-all duration-300 ease-glide sm:block ${
              location.pathname === '/account' ? 'border-ink text-ink' : 'border-line text-muted hover:border-accent hover:text-ink'
            }`}
          >
            {user ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-line bg-raised font-display text-[9px] font-bold text-ink">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
              </svg>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            aria-label={t('nav.cart')}
            className={`relative rounded-card border p-2 transition-all duration-300 ease-glide ${
              location.pathname === '/cart' ? 'border-ink bg-ink text-bg' : 'border-line text-ink hover:border-accent'
            }`}
          >
            <motion.span
              key={cartBump}
              className={`block ${cartBump > 0 ? 'animate-cart-bump' : ''}`}
            >
              <IconBag className="h-4 w-4" />
            </motion.span>
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="absolute -right-1.5 -top-1.5 flex min-w-[20px] items-center justify-center rounded-full bg-ink px-1 font-display text-[11px] font-bold text-bg ring-2 ring-bg"
                  style={{ height: 20 }}
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </div>

      {/* Mobile second row: search only */}
      <div
        className={`absolute inset-x-0 top-full flex items-center gap-2 border-t border-line-soft bg-bg/95 px-4 backdrop-blur-md transition-all duration-500 ease-glide sm:px-6 md:hidden ${
          hideSearch ? 'max-h-0 overflow-hidden border-t-0 opacity-0 pb-0 pt-0' : 'max-h-16 pb-3 pt-2.5'
        }`}
      >
        <div className="min-w-0 flex-1">{searchBox(hideSearch, 'mobile')}</div>
      </div>
    </header>
  )
}
