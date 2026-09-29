import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/StoreContext'
import { formatIDR } from '../data/products'
import { sfx } from '../lib/sound'
import { GLIDE, SETTLE } from '../components/Reveal'

const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  return { x: Math.cos(angle) * 90, y: Math.sin(angle) * 90, delay: 0.5 + (i % 4) * 0.05 }
})

export default function Success() {
  const { t, lastOrder, setLastOrder, addToCart } = useStore()
  const [showStatus, setShowStatus] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const cancelled = !!lastOrder?.cancelled

  const doCancel = () => {
    lastOrder.items.forEach((i) => addToCart(i.pid, i.size, i.qty))
    setLastOrder({ ...lastOrder, cancelled: true })
    setConfirmCancel(false)
    setShowStatus(false)
    sfx.remove()
  }

  if (!lastOrder) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-32 text-center">
        <p className="font-serif text-2xl italic text-muted">{t('ok.empty')}</p>
        <Link to="/" className="btn-primary">
          {t('ok.home')}
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pt-20 sm:px-6">
      {/* Confirmation animation */}
      <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
        {/* ring pulses */}
        {!cancelled &&
          [0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-accent"
              initial={{ scale: 0.6, opacity: 0.7 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 2, delay: 0.6 + i * 0.9, repeat: Infinity, repeatDelay: 0.4, ease: 'easeOut' }}
            />
          ))}
        {/* particles */}
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-accent"
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{ x: p.x, y: p.y, scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
          />
        ))}
        {/* disc + drawn checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
          className={`flex h-28 w-28 items-center justify-center rounded-full shadow-pop transition-colors duration-500 ${cancelled ? 'bg-warn' : 'bg-ink'}`}
        >
          {cancelled ? (
            <svg viewBox="0 0 52 52" className="h-14 w-14 text-bg">
              <motion.path
                d="M18 18 34 34 M34 18 18 34"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </svg>
          ) : (
            <svg viewBox="0 0 52 52" className="h-14 w-14 text-bg">
              <motion.path
                d="M14 27.5 22.5 36 38 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: 'easeInOut' }}
              />
            </svg>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7, ease: GLIDE }} className="mt-8 text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{cancelled ? t('ok.cancelledTitle') : t('ok.title')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{cancelled ? t('ok.cancelledSub') : t('ok.sub')}</p>
      </motion.div>

      {/* Order summary */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.85, ease: GLIDE }}
        className="mt-10 overflow-hidden rounded-card border border-line bg-surface"
      >
        <AnimatePresence>
          {cancelled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 overflow-hidden border-b border-line bg-warn/10 px-4"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-warn" />
              <p className="py-2.5 font-display text-xs font-bold uppercase tracking-wider text-warn">{t('ok.cancelledBadge')}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="grid grid-cols-2 divide-x divide-line border-b border-line sm:grid-cols-4">
          {[
            [t('ok.order'), lastOrder.id],
            [t('ok.date'), lastOrder.date],
            [t('ok.items'), String(lastOrder.items.reduce((s, i) => s + i.qty, 0))],
            [t('ok.total'), formatIDR(lastOrder.total)],
          ].map(([l, v]) => (
            <div key={l} className="px-4 py-4">
              <p className="label-mega">{l}</p>
              <p className="mt-1 truncate font-display text-sm font-bold">{v}</p>
            </div>
          ))}
        </div>
        <ul className="divide-y divide-line-soft">
          {lastOrder.items.map((i, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1 + idx * 0.08, ease: GLIDE }}
              className="flex items-center gap-4 px-4 py-3"
            >
              <span className="img-tile h-12 w-12 shrink-0">
                <img src={i.image} alt={i.model} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-sm font-semibold">{i.model}</span>
                <span className="block text-xs text-muted">
                  {i.brand} · {t('cart.size')} {i.size} · ×{i.qty}
                </span>
              </span>
              <span className="font-display text-sm font-bold">{formatIDR(i.price * i.qty)}</span>
            </motion.li>
          ))}
        </ul>
        <div className="border-t border-line px-4 py-3 text-xs text-muted">
          {t('co.reviewAddr')}: <span className="text-ink">{lastOrder.name}</span>, {lastOrder.address}
        </div>
        {lastOrder.courierNote && (
          <div className="border-t border-dashed border-accent/40 bg-accent/5 px-4 py-3">
            <p className="label-mega">{t('co.noteLabel')}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink">{lastOrder.courierNote}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-muted">
            {lastOrder.method ? t(`co.pay.${lastOrder.method}`) : ''}
          </span>
          {lastOrder.payMode === 'later' && lastOrder.tenor && (
            <span className="rounded-full border border-warn/50 bg-warn/10 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-warn">
              {t('co.payLater')} · {t(`co.tenor.${lastOrder.tenor}`)}
            </span>
          )}
          {lastOrder.method === 'cod' && <span className="text-[11px]">{t('co.codNote')}</span>}
        </div>
      </motion.div>

      {/* Status timeline */}
      <AnimatePresence initial={false}>
        {showStatus && (
          <motion.div
            key="status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: GLIDE }}
            className="overflow-hidden"
          >
            {cancelled ? (
              <div className="mt-8 rounded-card border border-warn/50 bg-warn/10 p-6">
                <p className="font-display text-sm font-semibold text-warn">{t('ok.cancelledStatus')}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{t('ok.cancelledCart')}</p>
              </div>
            ) : (
            <ol className="mt-8 space-y-0 rounded-card border border-line bg-surface p-6">
              {[1, 2, 3, 4].map((n, i) => {
                const done = n <= 2
                return (
                  <motion.li
                    key={n}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12, duration: 0.4, ease: GLIDE }}
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >
                    {n < 4 && <span className={`absolute left-[9px] top-6 h-full w-px ${done ? 'bg-ink' : 'bg-line'}`} />}
                    <motion.span
                      initial={false}
                      animate={{ scale: done ? 1 : 0.8 }}
                      className={`relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border ${
                        done ? 'border-ink bg-ink' : 'border-line bg-surface'
                      }`}
                    >
                      {done && (
                        <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }} viewBox="0 0 24 24" className="h-2.5 w-2.5 text-bg" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 13 4 4 10-10" />
                        </motion.svg>
                      )}
                    </motion.span>
                    <div>
                      <p className={`font-display text-sm font-semibold ${done ? '' : 'text-muted'}`}>{t(`ok.s${n}`)}</p>
                      <p className="text-xs text-muted">{t(`ok.s${n}d`)}</p>
                    </div>
                  </motion.li>
                )
              })}
            </ol>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel confirmation */}
      {confirmCancel && !cancelled && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: GLIDE }}
          className="mx-auto mt-8 max-w-md rounded-card border border-warn/50 bg-warn/10 p-5 text-center"
        >
          <p className="text-sm leading-relaxed text-ink">{t('ok.cancelQ')}</p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={doCancel} className="btn border-warn bg-warn text-bg hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0">
              {t('ok.cancelYes')}
            </button>
            <button onClick={() => setConfirmCancel(false)} className="btn-ghost">
              {t('ok.cancelNo')}
            </button>
          </div>
        </motion.div>
      )}

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1, ease: GLIDE }}
        className="mt-10 flex flex-col justify-center gap-3 pb-10 sm:flex-row"
      >
        <Link to="/" className="btn-primary">
          {t('ok.home')}
        </Link>
        <button onClick={() => setShowStatus((s) => !s)} className="btn-ghost">
          {showStatus ? t('ok.hide') : t('ok.status')}
        </button>
        {!cancelled && (
          <button
            onClick={() => {
              setConfirmCancel((v) => !v)
              sfx.tap()
            }}
            className="btn-ghost !border-warn/60 !text-warn hover:!bg-warn/10"
          >
            {t('ok.cancel')}
          </button>
        )}
      </motion.div>
    </main>
  )
}
