import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/StoreContext'
import { PRODUCTS, CATEGORIES, COLOR_KEYS, formatIDR } from '../data/products'
import { recommend } from '../lib/recommend'
import { GLIDE } from '../components/Reveal'
import { sfx } from '../lib/sound'
import FavButton from '../components/FavLikeButton'

const CAT_LABEL = {
  running: { id: 'Lari', en: 'Running' },
  lifestyle: { id: 'Lifestyle', en: 'Lifestyle' },
  basketball: { id: 'Basket', en: 'Basketball' },
  trail: { id: 'Trail', en: 'Trail' },
  kids: { id: 'Anak', en: 'Kids' },
}

const STATUS_KEY = {
  pending: 'dash.status.pending',
  inprogress: 'dash.status.inprogress',
  completed: 'dash.status.completed',
  cancelled: 'dash.status.cancelled',
}
const STATUS_COLOR = {
  pending: 'text-warn border-warn/40 bg-warn/10',
  inprogress: 'text-accent border-accent/40 bg-accent/10',
  completed: 'text-ok border-ok/40 bg-ok/10',
  cancelled: 'text-muted border-line bg-raised/40',
}

/** Live "time left" countdown (demo: 30-minute payment window). */
function useCountdown(deadline, active) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active, deadline])
  if (!active) return null
  const left = Math.max(0, deadline - now)
  return { mm: String(Math.floor(left / 60000)).padStart(2, '0'), ss: String(Math.floor(left / 1000) % 60).padStart(2, '0'), done: left === 0 }
}

function OrderCard({ o, onPay, onCancel, onTrack, deadlineFor }) {
  const { t } = useStore()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const isPending = o.status === 'pending'
  const countdown = useCountdown(deadlineFor(o), isPending)
  return (
    <div className={`rounded-card border bg-surface p-4 transition-all duration-300 ease-glide ${o.status === 'pending' ? 'border-warn/50 shadow-lift' : 'border-line'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-bold">{o.id}</p>
          <p className="text-xs text-muted">{o.date}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[o.status] || STATUS_COLOR.cancelled}`}>
          {t(STATUS_KEY[o.status] || STATUS_KEY.cancelled)}
        </span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {o.items.slice(0, 4).map((i, idx) => (
          <li key={idx} className="flex items-center gap-2 rounded-card border border-line bg-raised/40 px-2 py-1 text-xs">
            <span className="img-tile h-7 w-7">
              <img src={i.image} alt={i.model} />
            </span>
            <span className="max-w-[110px] truncate font-semibold">{i.model}</span>
            <span className="text-muted">×{i.qty}</span>
          </li>
        ))}
        {o.items.length > 4 && <li className="px-2 py-1 text-xs text-muted">+{o.items.length - 4}</li>}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
        <p className="font-display text-sm font-extrabold">{formatIDR(o.total)}</p>
        <div className="flex items-center gap-2">
          {o.status === 'pending' && countdown && (
            <span className="rounded-card bg-warn/10 px-2 py-1 font-display text-xs font-bold tabular-nums text-warn">
              {t('dash.deadline')} {countdown.mm}:{countdown.ss}
            </span>
          )}
          {(o.status === 'inprogress' || o.status === 'completed') && (
            <button onClick={() => onTrack(o)} className="rounded-card border border-line px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 ease-glide hover:border-ink hover:bg-ink hover:text-bg">
              {t('dash.tracking')}
            </button>
          )}
          {o.status === 'pending' && (
            <button
              onClick={() => onPay(o.id)}
              className="rounded-card border border-ok bg-ok px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-bg transition-all duration-300 ease-glide hover:-translate-y-0.5 hover:shadow-lift"
            >
              {t('dash.payNow')}
            </button>
          )}
          {(o.status === 'pending' || o.status === 'inprogress') && !confirmCancel && (
            <button
              onClick={() => setConfirmCancel(true)}
              className="rounded-card border border-line px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-muted transition-colors duration-300 hover:border-warn hover:text-warn"
            >
              {t('dash.cancelOrder')}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {confirmCancel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-center justify-between rounded-card border border-warn/40 bg-warn/10 px-3 py-2">
              <p className="text-xs font-semibold text-warn">{t('ok.cancelQ')}</p>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => {
                    onCancel(o.id)
                    setConfirmCancel(false)
                  }}
                  className="rounded-card bg-warn px-2.5 py-1 font-display text-[11px] font-bold uppercase text-bg"
                >
                  {t('ok.cancelYes')}
                </button>
                <button onClick={() => setConfirmCancel(false)} className="rounded-card border border-line px-2.5 py-1 font-display text-[11px] font-bold uppercase text-muted">
                  {t('ok.cancelNo')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Dashboard() {
  const { t, user, logout, favs, orders, payOrder, cancelOrder, saveUserPrefs, setQuick } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('favs')
  const [statusFilter, setStatusFilter] = useState('all')
  const [payFlash, setPayFlash] = useState(null)
  const [prefs, setPrefs] = useState(() => user?.prefs || { brands: [], categories: [], colors: [], gender: null })

  const favProducts = useMemo(() => PRODUCTS.filter((p) => favs.includes(p.id)), [favs])
  const pending = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders])
  const shown = useMemo(
    () => (statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter],
  )
  const recs = useMemo(() => recommend(PRODUCTS, user?.prefs || prefs, 8), [user, prefs])
  const deadlineFor = (o) => (o.placedAt || o.created || Date.now()) + 30 * 60 * 1000

  if (!user) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-28 text-center">
        <p className="font-serif text-2xl italic text-muted">{t('auth.demoNote')}</p>
        <p className="text-sm text-muted">{t('dash.sub')}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/login" className="btn-primary">{t('auth.login')}</Link>
          <Link to="/signup" className="btn-ghost">{t('auth.signup')}</Link>
        </div>
      </main>
    )
  }

  const onPay = (id) => {
    payOrder(id)
    setPayFlash(t('dash.payOk'))
    sfx.success()
    setTimeout(() => setPayFlash(null), 3500)
  }

  const TABS = [
    ['favs', t('dash.tabFavs')],
    ['orders', t('dash.tabOrders')],
    ['rec', t('dash.tabRec')],
    ['prefs', t('dash.tabPrefs')],
  ]

  return (
    <main className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{t('dash.title')}</h1>
          <p className="mt-2 text-sm text-muted">{user.name} · {user.email}</p>
        </div>
        <button onClick={() => { logout(); navigate('/') }} className="btn-ghost !border-line">
          {t('auth.logout')}
        </button>
      </div>

      <AnimatePresence>{payFlash && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mt-4 rounded-card border border-ok/50 bg-ok/10 px-4 py-2.5 text-sm font-semibold text-ok"
        >
          {payFlash}
        </motion.div>
      )}</AnimatePresence>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-line">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`relative px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
              tab === k ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {label}
            {tab === k && (
              <motion.span layoutId="dash-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
            )}
          </button>
        ))}
      </div>

      {/* ---------- FAVORITES ---------- */}
      {tab === 'favs' && (
        <section className="py-10">
          <h2 className="font-serif text-2xl font-semibold">{t('dash.favsTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('dash.favsSub')}</p>
          {favProducts.length === 0 ? (
            <div className="mt-8 rounded-card border border-dashed border-line py-16 text-center">
              <p className="font-serif text-xl italic text-muted">{t('dash.favsEmpty')}</p>
              <Link to="/" className="btn-ghost mt-4 inline-flex">{t('dash.favsEmptyCta')}</Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {favProducts.map((p) => (
                <div key={p.id} className="group flex flex-col rounded-card border border-line bg-surface p-4 transition-all duration-300 ease-glide hover:-translate-y-1 hover:shadow-lift">
                  <button onClick={() => setQuick(p)} className="img-tile aspect-square">
                    <img src={p.image} alt={p.model} loading="lazy" />
                  </button>
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="label-mega">{p.brand}</p>
                      <p className="truncate font-display text-sm font-semibold">{p.model}</p>
                    </div>
                    <FavButton productId={p.id} />
                  </div>
                  <p className="mt-2 font-display text-sm font-bold">{formatIDR(p.price)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---------- ORDERS ---------- */}
      {tab === 'orders' && (
        <section className="py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-semibold">{t('dash.ordersTitle')}</h2>
              <p className="mt-1 text-sm text-muted">{t('dash.ordersSub')}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'pending', 'inprogress', 'completed', 'cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-card border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition-all duration-300 ease-glide ${
                    statusFilter === s ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:border-accent hover:text-ink'
                  }`}
                >
                  {t(`dash.filter${s === 'all' ? 'All' : s === 'inprogress' ? 'Inprogress' : s.charAt(0).toUpperCase() + s.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Pending payment cards */}
          {pending.length > 0 && (
            <div className="mt-8">
              <p className="label-mega mb-3">{t('dash.pendingTitle')}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {pending.map((o) => (
                  <OrderCard key={o.id} o={o} onPay={onPay} onCancel={cancelOrder} onTrack={null} deadlineFor={deadlineFor} />
                ))}
              </div>
            </div>
          )}

          {/* Full history */}
          {orders.length === 0 ? (
            <div className="mt-8 rounded-card border border-dashed border-line py-16 text-center">
              <p className="font-serif text-xl italic text-muted">{t('dash.ordersEmpty')}</p>
              <Link to="/" className="btn-ghost mt-4 inline-flex">{t('dash.ordersEmptyCta')}</Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {shown.map((o) => (
                <OrderCard
                  key={o.id}
                  o={o}
                  onPay={onPay}
                  onCancel={cancelOrder}
                  onTrack={(order) => navigate(`/track/${order.id}`)}
                  deadlineFor={deadlineFor}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---------- RECOMMENDATIONS ---------- */}
      {tab === 'rec' && (
        <section className="py-10">
          <h2 className="font-serif text-2xl font-semibold">{t('dash.recTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('dash.recSub')}</p>
          {recs.length === 0 ? (
            <div className="mt-8 rounded-card border border-dashed border-line py-16 text-center">
              <p className="font-serif text-xl italic text-muted">{t('dash.recEmpty')}</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {recs.map((p) => (
                <div key={p.id} className="group flex flex-col rounded-card border border-line bg-surface p-4 transition-all duration-300 ease-glide hover:-translate-y-1 hover:shadow-lift">
                  <button onClick={() => setQuick(p)} className="img-tile aspect-square">
                    <img src={p.image} alt={p.model} loading="lazy" />
                  </button>
                  <p className="label-mega mt-3">{p.brand}</p>
                  <p className="truncate font-display text-sm font-semibold">{p.model}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-display text-sm font-bold">{formatIDR(p.price)}</p>
                    <button
                      onClick={() => setQuick(p)}
                      className="rounded-card border border-line px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ease-glide hover:border-ink hover:bg-ink hover:text-bg"
                    >
                      {t('fav.view')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---------- PREFERENCES ---------- */}
      {tab === 'prefs' && (
        <section className="py-10">
          <h2 className="font-serif text-2xl font-semibold">{t('dash.prefsTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('dash.prefsSub')}</p>
          <PrefsEditor prefs={prefs} setPrefs={setPrefs} onSave={() => { saveUserPrefs(prefs); sfx.success() }} savedFlash={false} />
        </section>
      )}
    </main>
  )
}

function PrefsEditor({ prefs, setPrefs, onSave }) {
  const { t, lang } = useStore()
  const [saved, setSaved] = useState(false)
  const toggleIn = (k, v) =>
    setPrefs((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }))
  const chip = (active) =>
    `rounded-card border px-2.5 py-1 font-display text-xs font-semibold transition-all duration-300 ease-glide ${
      active ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:border-accent hover:text-ink'
    }`

  return (
    <div className="mt-8 max-w-xl space-y-5 rounded-card border border-line bg-surface p-6">
      <div>
        <p className="label-mega mb-2">{t('auth.onb.brand')}</p>
        <div className="flex flex-wrap gap-1.5">
          {PRODUCTS.map((p) => p.brand)
            .filter((b, i, a) => a.indexOf(b) === i)
            .sort()
            .map((b) => (
              <button key={b} onClick={() => toggleIn('brands', b)} className={chip(prefs.brands.includes(b))}>{b}</button>
            ))}
        </div>
      </div>
      <div>
        <p className="label-mega mb-2">{t('auth.onb.cat')}</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => toggleIn('categories', c)} className={chip(prefs.categories.includes(c))}>
              {CAT_LABEL[c][lang]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="label-mega mb-2">{t('auth.onb.color')}</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_KEYS.map((c) => (
            <button
              key={c.key}
              title={c.label[lang]}
              onClick={() => toggleIn('colors', c.key)}
              className={`h-6 w-6 rounded-full border transition-all duration-300 ease-glide hover:scale-110 ${
                prefs.colors.includes(c.key) ? 'border-ink ring-2 ring-ink ring-offset-2 ring-offset-surface' : 'border-line'
              }`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="label-mega mb-2">{t('auth.onb.gender')}</p>
        <div className="flex flex-wrap gap-1.5">
          {['men', 'women', 'kids'].map((g) => (
            <button key={g} onClick={() => setPrefs((p) => ({ ...p, gender: p.gender === g ? null : g }))} className={chip(prefs.gender === g)}>
              {g === 'kids' ? CAT_LABEL.kids[lang] : t(`nav.${g}`)}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          onSave()
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        }}
        className="btn-primary"
      >
        {t('dash.prefsSave')}
      </button>
      {saved && <p className="text-xs font-semibold text-ok">{t('dash.prefsSaved')}</p>}
    </div>
  )
}
