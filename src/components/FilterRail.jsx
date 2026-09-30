import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/StoreContext'
import { BRANDS, ALL_SIZES, CATEGORIES, COLOR_KEYS, PRICE_MIN, PRICE_MAX, formatIDR } from '../data/products'
import { sfx } from '../lib/sound'
import { GLIDE } from './Reveal'

const CAT_LABEL = {
  running: { id: 'Lari', en: 'Running' },
  lifestyle: { id: 'Lifestyle', en: 'Lifestyle' },
  basketball: { id: 'Basket', en: 'Basketball' },
  trail: { id: 'Trail', en: 'Trail' },
}

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function Group({ label, children }) {
  return (
    <div className="border-b border-line-soft py-4 first:pt-0 last:border-b-0">
      <p className="label-mega mb-3">{label}</p>
      {children}
    </div>
  )
}

export default function FilterRail({ filters, setFilters, open, setOpen, resultCount }) {
  const { t, lang } = useStore()

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))
  const pick = (key, value) => set({ [key]: filters[key] === value ? null : value })

  const isDirty =
    filters.brand ||
    filters.size ||
    filters.color ||
    filters.cats.length ||
    filters.priceMin !== PRICE_MIN ||
    filters.priceMax !== PRICE_MAX

  const chip = (active) =>
    `rounded-card border px-2.5 py-1 font-display text-xs font-semibold transition-all duration-300 ease-glide ${
      active ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:border-accent hover:text-ink'
    }`

  const body = (
    <div className="px-1">
      <Group label={t('filter.brand')}>
        <div className="flex flex-wrap gap-1.5">
          {BRANDS.map((b) => (
            <button key={b} onClick={() => pick('brand', b)} className={chip(filters.brand === b)}>
              {b}
            </button>
          ))}
        </div>
      </Group>

      <Group label={t('filter.size')}>
        <div className="grid grid-cols-5 gap-1.5">
          {ALL_SIZES.map((s) => (
            <button key={s} onClick={() => pick('size', s)} className={chip(filters.size === s)}>
              {s}
            </button>
          ))}
        </div>
      </Group>

      <Group label={t('filter.color')}>
        <div className="flex flex-wrap gap-2.5">
          {COLOR_KEYS.map((c) => (
            <button
              key={c.key}
              title={c.label[lang]}
              aria-label={c.label[lang]}
              onClick={() => pick('color', c.key)}
              className={`relative h-7 w-7 rounded-full border transition-all duration-300 ease-glide hover:scale-110 ${
                filters.color === c.key ? 'border-ink ring-2 ring-ink ring-offset-2 ring-offset-surface' : 'border-line'
              }`}
              style={{ background: c.hex }}
            >
              {filters.color === c.key && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  viewBox="0 0 24 24"
                  className="absolute inset-0 m-auto h-3.5 w-3.5"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 13 4 4 10-10" />
                </motion.svg>
              )}
            </button>
          ))}
        </div>
      </Group>

      <Group label={t('filter.price')}>
        <div className="space-y-3">
          <div className="flex items-center justify-between font-display text-xs font-semibold">
            <span>{formatIDR(filters.priceMin)}</span>
            <span className="text-muted">—</span>
            <span>{formatIDR(filters.priceMax)}</span>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">Min</span>
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={100000}
              value={filters.priceMin}
              onChange={(e) => set({ priceMin: Math.min(Number(e.target.value), filters.priceMax - 100000) })}
              className="w-full"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">Max</span>
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={100000}
              value={filters.priceMax}
              onChange={(e) => set({ priceMax: Math.max(Number(e.target.value), filters.priceMin + 100000) })}
              className="w-full"
            />
          </label>
        </div>
      </Group>

      <Group label={t('filter.category')}>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => set({ cats: toggle(filters.cats, c) })} className={chip(filters.cats.includes(c))}>
              {CAT_LABEL[c][lang]}
            </button>
          ))}
        </div>
      </Group>

      <div className="flex items-center justify-between pt-4">
        <p className="text-xs text-muted">
          <span className="font-display font-bold text-ink">{resultCount}</span> {t('filter.results')}
        </p>
        <button
          onClick={() => {
            setFilters((f) => ({ ...f, brand: null, size: null, color: null, cats: [], priceMin: PRICE_MIN, priceMax: PRICE_MAX }))
            sfx.tap()
          }}
          disabled={!isDirty}
          className="font-display text-xs font-semibold uppercase tracking-wider text-accent transition-opacity duration-300 hover:underline disabled:opacity-40 disabled:hover:no-underline"
        >
          {t('filter.reset')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-w-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex w-full items-center justify-between rounded-card border border-line px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider lg:hidden"
      >
        {open ? t('filter.hide') : t('filter.show')}
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.35, ease: GLIDE }}
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="m6 9 6 6 6-6" />
        </motion.svg>
      </button>

      <aside className="hidden lg:block">{body}</aside>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="rail-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: GLIDE }}
            className="overflow-hidden rounded-card border border-line bg-surface px-4 lg:hidden"
          >
            <div className="py-4">{body}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
