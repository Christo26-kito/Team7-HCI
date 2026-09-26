import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useStore } from '../store/StoreContext'
import { PRODUCTS, PRICE_MIN, PRICE_MAX, formatIDR, img } from '../data/products'
import { recommend } from '../lib/recommend'
import ProductCard from '../components/ProductCard'
import FilterRail from '../components/FilterRail'
import Reveal, { GLIDE } from '../components/Reveal'
import HeroTilt from '../components/HeroTilt'
import { sfx } from '../lib/sound'
import useDragScroll from '../lib/useDragScroll'

const SORTS = ['popular', 'newest', 'priceAsc', 'priceDesc', 'rating']
const CAT_GENDERS = ['all', 'men', 'women', 'kids']
const CAT_ROWS = 2
const SLIDE_MS = 5000

function RailArrows({ onPrev, onNext, prevLabel, nextLabel }) {
  return (
    <div className="flex gap-2">
      <button onClick={onPrev} aria-label={prevLabel} className="rounded-card border border-line p-2.5 transition-all duration-300 ease-glide hover:-translate-x-0.5 hover:border-accent">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>
      <button onClick={onNext} aria-label={nextLabel} className="rounded-card border border-line p-2.5 transition-all duration-300 ease-glide hover:translate-x-0.5 hover:border-accent">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
    </div>
  )
}

export default function Home() {
  const { t, lang, query, setQuick, user, setKidsMode } = useStore()
  const [catGender, setCatGender] = useState('all')
  const [filters, setFilters] = useState({
    brand: null,
    size: null,
    color: null,
    cats: [],
    priceMin: PRICE_MIN,
    priceMax: PRICE_MAX,
    sort: 'popular',
  })
  const [railOpen, setRailOpen] = useState(false)
  const [catCols, setCatCols] = useState(() => (window.innerWidth >= 1280 ? 4 : window.innerWidth >= 640 ? 3 : 2))
  useEffect(() => {
    const onResize = () => setCatCols(window.innerWidth >= 1280 ? 4 : window.innerWidth >= 640 ? 3 : 2)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef(null)
  useEffect(() => {
    if (!sortOpen) return
    const onPointerDown = (e) => {
      if (!sortRef.current?.contains(e.target)) setSortOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSortOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [sortOpen])

  /* ---------- hero slideshow (lightweight image slides w/ 3D depth) ---------- */
  const slides = useMemo(
    () => [
      { img: img('/images/hero.png'), brand: 'Sole Archive', model: t('hero.badge'), price: null, product: null },
      ...PRODUCTS.filter((p) => p.tags.includes('popular'))
        .slice(0, 3)
        .map((p) => ({ img: p.image, brand: p.brand, model: p.model, price: p.price, product: p })),
    ],
    [t],
  )
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(id)
  }, [paused, slides.length])

  /* ---------- new arrival carousel ---------- */
  const railRef = useRef(null)
  const scrollRail = (dir) => railRef.current?.scrollBy({ left: dir * railRef.current.clientWidth, behavior: 'smooth' })
  const catRailRef = useRef(null)
  const scrollCatRail = (dir) => {
    const el = catRailRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }
  const favRailRef = useRef(null)
  const scrollFavRail = (dir) => favRailRef.current?.scrollBy({ left: dir * favRailRef.current.clientWidth, behavior: 'smooth' })

  /* deterministic CTA anchor scroll (native fragment scroll is flaky in some browsers) */
  const ctaTo = (id, e) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const soonRailRef = useRef(null)
  const scrollSoonRail = (dir) => soonRailRef.current?.scrollBy({ left: dir * soonRailRef.current.clientWidth, behavior: 'smooth' })
  useDragScroll(railRef)
  useDragScroll(catRailRef)
  useDragScroll(favRailRef)
  useDragScroll(soonRailRef)
  const newDrops = useMemo(() => PRODUCTS.filter((p) => p.status !== 'soon' && p.tags.includes('new')), [])
  const soonDrops = useMemo(() => PRODUCTS.filter((p) => p.status === 'soon'), [])

  /* ---------- hero parallax ---------- */
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-8%'])

  /* Global "kid section" theme follows the catalog gender filter */
  useEffect(() => {
    setKidsMode(catGender === 'kids')
  }, [catGender, setKidsMode])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = PRODUCTS.filter((p) => {
      if (p.status === 'soon' && !q) return false
      if (catGender === 'women' && p.gender !== 'women') return false
      if (catGender === 'men' && p.gender !== 'men' && p.gender !== 'unisex') return false
      if (catGender === 'kids' && p.gender !== 'kids') return false
      if (filters.brand && p.brand !== filters.brand) return false
      if (filters.size && !p.sizes.includes(filters.size)) return false
      if (filters.color && p.colorKey !== filters.color) return false
      if (filters.cats.length && !filters.cats.includes(p.category)) return false
      if (p.price < filters.priceMin || p.price > filters.priceMax) return false
      if (q) {
        const hay = `${p.brand} ${p.model} ${p.colorway} ${p.category}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    const by = {
      popular: (a, b) => b.likes - a.likes,
      newest: (a, b) => Number(b.tags.includes('new')) - Number(a.tags.includes('new')) || b.likes - a.likes,
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
    }[filters.sort]
    return [...list].sort(by)
  }, [catGender, query, filters])

  // rail scrolls horizontally, so chunk into columns; row-major order kept inside each visible page
  const catColumns = useMemo(() => {
    const perPage = catCols * CAT_ROWS
    const cols = []
    for (let start = 0; start < filtered.length; start += perPage) {
      const page = filtered.slice(start, start + perPage)
      for (let c = 0; c < catCols; c++) {
        const col = []
        for (let r = 0; r < CAT_ROWS; r++) {
          const p = page[r * catCols + c]
          if (p) col.push(p)
        }
        if (col.length) cols.push(col)
      }
    }
    return cols
  }, [filtered, catCols])

  const favorites = useMemo(() => [...PRODUCTS].filter((p) => p.status !== 'soon').sort((a, b) => b.likes - a.likes).slice(0, 8), [])

  const kidsItems = useMemo(() => PRODUCTS.filter((p) => p.gender === 'kids' && p.status !== 'soon'), [])
  const recs = useMemo(
    () => (user ? recommend(PRODUCTS, user.prefs, 4) : PRODUCTS.filter((p) => p.status !== 'soon').sort((a, b) => b.likes - a.likes).slice(0, 4)),
    [user],
  )

  const marqueeItems = [1, 2, 3, 4, 5].map((i) => t(`marquee.${i}`))

  return (
    <main>
      {/* ============ HERO + SLIDESHOW ============ */}
      <section ref={heroRef} className="relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:pb-32 lg:pt-20">
          <motion.div style={{ y: textY }} className="relative z-10">
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: GLIDE }} className="label-mega">
              {t('hero.eyebrow')}
            </motion.p>
            <h1 className="mt-5 font-serif text-[13vw] font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              {['hero.title1', 'hero.title2', 'hero.title3'].map((k, i) => (
                <motion.span
                  key={k}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.12 + i * 0.12, ease: GLIDE }}
                  className={`block ${i === 1 ? 'italic text-accent' : ''}`}
                >
                  {t(k)}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: GLIDE }}
              className="mt-6 max-w-md text-base leading-relaxed text-muted"
            >
              {t('hero.sub')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.62, ease: GLIDE }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <a href="#katalog" onClick={(e) => ctaTo('katalog', e)} className="btn-primary">
                {t('hero.cta1')}
              </a>
              <a href="#favorit" onClick={(e) => ctaTo('favorit', e)} className="btn-ghost">
                {t('hero.cta2')}
              </a>
            </motion.div>

            <motion.dl
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.8 }}
              className="mt-12 grid max-w-md grid-cols-3 divide-x divide-line border-y border-line"
            >
              {[
                ['120+', t('hero.stat1')],
                ['10', t('hero.stat2')],
                ['4.7', t('hero.stat3')],
              ].map(([v, l]) => (
                <div key={l} className="px-4 py-4 first:pl-0">
                  <dt className="font-display text-2xl font-extrabold">{v}</dt>
                  <dd className="mt-0.5 text-[11px] uppercase tracking-wider text-muted">{l}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          {/* slideshow */}
          <motion.div
            style={{ y: imgY }}
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="img-tile aspect-[4/5] shadow-lift">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.9, ease: GLIDE }}
                  className="absolute inset-0"
                >
                  <HeroTilt
                    key={slide}
                    src={slides[slide].img}
                    alt={`${slides[slide].brand} ${slides[slide].model}`}
                    onQuick={
                      slides[slide].product
                        ? () => {
                            setQuick(slides[slide].product)
                            sfx.tap()
                          }
                        : undefined
                    }
                  />
                </motion.div>
              </AnimatePresence>

              {/* caption */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`cap-${slide}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: GLIDE }}
                  className="absolute bottom-4 left-4 z-10 rounded-card border border-line bg-raised/85 px-4 py-2.5 backdrop-blur"
                >
                  <p className="label-mega">{slides[slide].brand}</p>
                  <p className="font-serif text-lg font-semibold leading-tight">{slides[slide].model}</p>
                  {slides[slide].price && <p className="text-xs text-muted">{formatIDR(slides[slide].price)}</p>}
                </motion.div>
              </AnimatePresence>

              {/* progress */}
              <div className="absolute inset-x-0 top-0 z-10 h-0.5 bg-black/10">
                <motion.div
                  key={`bar-${slide}-${paused}`}
                  className="h-full bg-black/80"
                  initial={{ width: '0%' }}
                  animate={{ width: paused ? undefined : '100%' }}
                  transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }}
                />
              </div>
            </div>

            {/* controls */}
            <div className="absolute -bottom-5 right-4 z-10 flex items-center gap-2">
              <div className="mr-2 flex items-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    aria-label={`${t('hero.slide')} ${i + 1}`}
                    className="group py-2"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-500 ease-glide ${
                        i === slide ? 'w-6 bg-ink' : 'w-1.5 bg-ink/25 group-hover:bg-ink/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
                aria-label={t('drop.prev')}
                className="rounded-card border border-line bg-raised p-2.5 text-ink transition-all duration-300 ease-glide hover:-translate-x-0.5 hover:shadow-lift"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
              <button
                onClick={() => setSlide((s) => (s + 1) % slides.length)}
                aria-label={t('drop.next')}
                className="rounded-card border border-line bg-raised p-2.5 text-ink transition-all duration-300 ease-glide hover:translate-x-0.5 hover:shadow-lift"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ KID SECTION (ceria / colorful) ============ */}
      {catGender === 'kids' && kidsItems.length > 0 && (
        <section id="kids" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border-2 border-dashed p-5 sm:p-6" style={{ borderColor: '#F5B6C1' }}>
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl" style={{ background: 'linear-gradient(135deg,#FFD6E0,#D6F0FF)' }}>
                  👟
                </span>
                <div>
                  <h2 className="font-serif text-3xl font-bold tracking-tight" style={{ color: '#E85C7E' }}>{t('kids.title')}</h2>
                  <p className="mt-1 text-sm font-medium" style={{ color: '#8a6d8f' }}>{t('kids.sub')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCatGender('kids')
                  document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#FF8FAB,#6FB8FF)' }}
              >
                {t('nav.kids')} →
              </button>
            </div>
          </Reveal>

          <div className="no-scrollbar mt-5 flex gap-4 overflow-x-auto pb-2">
            {kidsItems.map((p) => (
              <div key={p.id} className="w-[180px] shrink-0">
                <div
                  className="group flex h-full flex-col rounded-2xl border-2 bg-white p-3 transition-transform hover:-translate-y-1"
                  style={{ borderColor: p.colorHex, boxShadow: `0 10px 30px -12px ${p.colorHex}` }}
                >
                  <button onClick={() => setQuick(p)} className="img-tile !rounded-xl aspect-square w-full" style={{ background: `${p.colorHex}22` }}>
                    <img src={p.image} alt={p.model} loading="lazy" />
                  </button>
                  <p className="label-mega mt-2.5" style={{ color: p.colorHex }}>{p.brand}</p>
                  <p className="font-display text-sm font-bold">{p.model}</p>
                  <p className="mt-0.5 text-[11px] font-medium" style={{ color: p.colorHex }}>{t('kids.sizeNote')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ RECOMMEND FOR YOU ============ */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-14 sm:px-6 sm:pb-16 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
            <div>
              <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{t('dash.recTitle')}</h2>
              <p className="mt-1.5 max-w-md text-sm text-muted">{user ? t('dash.recSub') : t('dash.recEmpty')}</p>
            </div>
            {!user && (
              <Link to="/signup" className="btn-ghost !py-2.5 text-xs">{t('auth.linkSignup')} →</Link>
            )}
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-5 pt-6 sm:grid-cols-4">
          {recs.map((p) => (
            <div key={p.id} className="group flex flex-col rounded-card border border-line bg-surface p-4 transition-all duration-300 ease-glide hover:-translate-y-1 hover:shadow-lift">
              <button onClick={() => setQuick(p)} className="img-tile aspect-square w-full">
                <img src={p.image} alt={p.model} loading="lazy" />
              </button>
              <p className="label-mega mt-3">{p.brand}</p>
              <p className="truncate font-display text-sm font-semibold">{p.model}</p>
              <p className="mt-1 font-display text-sm font-bold">{formatIDR(p.price)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className="overflow-hidden border-b border-line bg-surface py-3.5">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-xs font-semibold uppercase tracking-mega text-muted">
              {item}
              <span className="text-accent">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ============ NEW ARRIVALS ============ */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
            <div>
              <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{t('new.title')}</h2>
              <p className="mt-2 max-w-md text-sm text-muted">{t('new.sub')}</p>
            </div>
            <RailArrows onPrev={() => scrollRail(-1)} onNext={() => scrollRail(1)} prevLabel={t('drop.prev')} nextLabel={t('drop.next')} />
          </div>
        </Reveal>

        <div ref={railRef} className="no-scrollbar flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto pt-8">
          {newDrops.map((p) => (
            <div key={p.id} className="w-[calc((100%-20px)/2)] shrink-0 snap-start sm:w-[calc((100%-40px)/3)] lg:w-[calc((100%-60px)/4)]">
              <ProductCard product={p} onQuickView={setQuick} />
            </div>
          ))}
        </div>
      </section>

      {/* ============ COMING SOON ============ */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
            <div>
              <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{t('soon.title')}</h2>
              <p className="mt-2 max-w-md text-sm text-muted">{t('soon.sub')}</p>
            </div>
            <RailArrows onPrev={() => scrollSoonRail(-1)} onNext={() => scrollSoonRail(1)} prevLabel={t('drop.prev')} nextLabel={t('drop.next')} />
          </div>
        </Reveal>

        <div ref={soonRailRef} className="no-scrollbar flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto pt-8">
          {soonDrops.map((p) => (
            <div key={p.id} className="w-[calc((100%-20px)/2)] shrink-0 snap-start sm:w-[calc((100%-40px)/3)] lg:w-[calc((100%-60px)/4)]">
              <ProductCard product={p} onQuickView={setQuick} />
            </div>
          ))}
        </div>
      </section>

      {/* ============ CATALOG ============ */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
        <Reveal>
          <div id="katalog" className="flex scroll-mt-20 flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
            <div>
              <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{t('cat.title')}</h2>
              <p className="mt-2 max-w-md text-sm text-muted">{t('cat.sub')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-card border border-line p-0.5">
                {CAT_GENDERS.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setCatGender(g)
                      sfx.tap()
                    }}
                    className={`relative rounded-[4px] px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                      catGender === g ? 'text-bg' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {catGender === g && (
                      <motion.span
                        layoutId="cat-gender-pill"
                        className="absolute inset-0 rounded-[4px] bg-ink"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">{t(`nav.${g}`)}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="label-mega">{t('sort.label')}</span>
                <div ref={sortRef} className="relative">
                  <button
                    onClick={() => setSortOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                    className="field flex !w-auto !py-2 items-center gap-3 text-sm"
                  >
                    {t(`sort.${filters.sort}`)}
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-3.5 w-3.5 text-muted transition-transform duration-300 ease-glide ${sortOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {sortOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: GLIDE }}
                        role="listbox"
                        className="absolute right-0 top-[calc(100%+0.4rem)] z-30 w-48 origin-top overflow-hidden rounded-card border border-line bg-surface py-1 shadow-pop"
                      >
                        {SORTS.map((s) => (
                          <li key={s}>
                            <button
                              role="option"
                              aria-selected={filters.sort === s}
                              onClick={() => {
                                setFilters((f) => ({ ...f, sort: s }))
                                setSortOpen(false)
                                sfx.tap()
                              }}
                              className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors duration-200 hover:bg-raised ${
                                filters.sort === s ? 'font-semibold text-ink' : 'text-muted'
                              }`}
                            >
                              {t(`sort.${s}`)}
                              {filters.sort === s && (
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m5 13 4 4 10-10" />
                                </svg>
                              )}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => scrollCatRail(-1)} aria-label={t('drop.prev')} className="rounded-card border border-line p-2.5 transition-all duration-300 ease-glide hover:-translate-x-0.5 hover:border-accent">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 6-6 6 6 6" />
                  </svg>
                </button>
                <button onClick={() => scrollCatRail(1)} aria-label={t('drop.next')} className="rounded-card border border-line p-2.5 transition-all duration-300 ease-glide hover:translate-x-0.5 hover:border-accent">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-10 pt-8 lg:grid-cols-[240px_1fr] lg:gap-12">
          <FilterRail filters={filters} setFilters={setFilters} open={railOpen} setOpen={setRailOpen} resultCount={filtered.length} />

          <div className="min-w-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-line py-24 text-center">
                <p className="font-serif text-2xl italic text-muted">{t('cat.empty')}</p>
                <button
                  onClick={() => setFilters((f) => ({ ...f, brand: null, size: null, color: null, cats: [], priceMin: PRICE_MIN, priceMax: PRICE_MAX }))}
                  className="btn-ghost"
                >
                  {t('cat.emptyCta')}
                </button>
              </div>
            ) : (
              <div
                ref={catRailRef}
                className="no-scrollbar flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto"
              >
                {catColumns.map((col, i) => (
                  <div
                    key={i}
                    className="flex w-[calc((100%-20px)/2)] shrink-0 snap-start flex-col gap-5 sm:w-[calc((100%-40px)/3)] xl:w-[calc((100%-60px)/4)]"
                  >
                    {col.map((p) => (
                      <ProductCard key={p.id} product={p} onQuickView={setQuick} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ FAVORITES ============ */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
        <Reveal>
          <div id="favorit" className="flex scroll-mt-20 flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
            <div>
              <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{t('fav.title')}</h2>
              <p className="mt-2 max-w-md text-sm text-muted">{t('fav.sub')}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scrollFavRail(-1)} aria-label={t('drop.prev')} className="rounded-card border border-line p-2.5 transition-all duration-300 ease-glide hover:-translate-x-0.5 hover:border-accent">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
              <button onClick={() => scrollFavRail(1)} aria-label={t('drop.next')} className="rounded-card border border-line p-2.5 transition-all duration-300 ease-glide hover:translate-x-0.5 hover:border-accent">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </Reveal>

        <div ref={favRailRef} className="no-scrollbar flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto pt-8">
          {favorites.map((p, i) => (
            <div key={p.id} className="w-[calc((100%-20px)/2)] shrink-0 snap-start sm:w-[calc((100%-40px)/3)] lg:w-[calc((100%-60px)/4)]">
              <div className="group flex h-full flex-col rounded-card border border-line bg-surface p-4 transition-all duration-300 ease-glide hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-extrabold text-ink/20 transition-colors duration-300 group-hover:text-accent">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-accent" aria-hidden>
                      <path d="m12 17.3-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7L12 17.3Z" />
                    </svg>
                    <span className="font-semibold text-ink">{p.rating.toFixed(1)}</span>
                    <span aria-hidden>·</span>
                    <span>♥ {p.likes.toLocaleString('id-ID')}</span>
                  </p>
                </div>

                <button onClick={() => setQuick(p)} className="mt-3 text-left" aria-label={`${p.brand} ${p.model}`}>
                  <span className="img-tile block aspect-square w-full">
                    <img src={p.image} alt={p.model} loading="lazy" className="transition-transform duration-700 ease-glide group-hover:scale-[1.07]" />
                  </span>
                </button>

                <p className="label-mega mt-4">{p.brand}</p>
                <h3 className="mt-1 truncate font-display text-base font-semibold leading-tight">{p.model}</h3>
                <p className="mt-0.5 truncate text-xs text-muted">{p.colorway}</p>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <p className="font-display text-sm font-bold">{formatIDR(p.price)}</p>
                  <button
                    onClick={() => setQuick(p)}
                    className="rounded-card border border-line px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition-all duration-300 ease-glide hover:border-ink hover:bg-ink hover:text-bg"
                  >
                    {t('fav.view')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Reveal className="mt-16">
          <div className="flex flex-col items-center justify-between gap-6 rounded-card border border-line bg-surface px-8 py-10 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-serif text-2xl font-semibold italic">SOLE⌁ARCHIVE</p>
              <p className="mt-1 text-sm text-muted">{t('footer.tag')}</p>
            </div>
            <Link to="/cart" className="btn-primary shrink-0">
              {t('nav.cart')} →
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
