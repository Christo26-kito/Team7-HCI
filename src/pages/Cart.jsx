import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/StoreContext'
import { formatIDR } from '../data/products'
import { sfx } from '../lib/sound'
import { GLIDE } from '../components/Reveal'

const CODES = { SOLE10: 0.1, VAULT15: 0.15 }

export default function Cart() {
  const { t, user, cartDetailed, setQty, removeItem, subtotal, discount, shipping, total, promo, setPromo } = useStore()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [promoMsg, setPromoMsg] = useState(null)
  const [shake, setShake] = useState(false)

  const applyPromo = (e) => {
    e.preventDefault()
    const key = code.trim().toUpperCase()
    if (CODES[key]) {
      setPromo({ code: key, rate: CODES[key] })
      setPromoMsg({ ok: true, text: `${t('cart.promoOk')} ${formatIDR(Math.round(subtotal * CODES[key]))}` })
      sfx.click()
    } else {
      setPromo(null)
      setPromoMsg({ ok: false, text: t('cart.promoBad') })
      setShake(true)
      sfx.error()
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{t('cart.title')}</h1>
          <p className="mt-2 text-sm text-muted">{t('cart.sub')}</p>
        </div>
        <Link to="/" className="text-sm text-accent transition-opacity hover:opacity-70">
          ← {t('cart.continue')}
        </Link>
      </div>

      {cartDetailed.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-28 text-center">
          <motion.svg
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            viewBox="0 0 24 24"
            className="h-16 w-16 text-ink/20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8h12l-1 12H7L6 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </motion.svg>
          <p className="font-serif text-2xl italic text-muted">{t('cart.empty')}</p>
          <Link to="/" className="btn-primary">
            {t('cart.emptyCta')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 py-10 lg:grid-cols-[1fr_380px] lg:gap-14">
          {/* ---------- item cards ---------- */}
          <motion.ul layout className="space-y-4">
            <AnimatePresence initial={false}>
              {cartDetailed.map((item) => (
                <motion.li
                  layout
                  key={`${item.id}-${item.size}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -80, scale: 0.96, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.45, ease: GLIDE }}
                  className="overflow-hidden"
                >
                  <div className="group rounded-card border border-line bg-surface p-4 transition-all duration-500 ease-glide hover:border-accent/60 hover:shadow-lift sm:p-5">
                    <div className="flex gap-4 sm:gap-6">
                      <div className="img-tile relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
                        <img src={item.product.image} alt={item.product.model} className="group-hover:scale-105" />
                        <span className="absolute bottom-2 left-2 rounded-card bg-ink/85 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-bg backdrop-blur">
                          UK {item.size}
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="label-mega">{item.product.brand}</p>
                            <h3 className="mt-1 truncate font-display text-lg font-semibold leading-tight">{item.product.model}</h3>
                            <p className="mt-0.5 truncate text-xs text-muted">{item.product.colorway}</p>
                          </div>
                          <button
                            onClick={() => {
                              removeItem(item.id, item.size)
                              sfx.remove()
                            }}
                            aria-label={t('cart.remove')}
                            title={t('cart.remove')}
                            className="rounded-card border border-line p-2 text-muted transition-all duration-300 ease-glide hover:rotate-90 hover:border-warn hover:text-warn"
                          >
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                              <path d="m6 6 12 12M18 6 6 18" />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                          <div className="flex items-center rounded-card border border-line bg-bg/40">
                            <button
                              onClick={() => setQty(item.id, item.size, item.qty - 1)}
                              className="px-3.5 py-2 text-muted transition-colors hover:text-ink"
                              aria-label="-"
                            >
                              −
                            </button>
                            <motion.span
                              key={item.qty}
                              initial={{ scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                              className="w-9 text-center font-display text-sm font-bold"
                            >
                              {item.qty}
                            </motion.span>
                            <button
                              onClick={() => setQty(item.id, item.size, Math.min(9, item.qty + 1))}
                              className="px-3.5 py-2 text-muted transition-colors hover:text-ink"
                              aria-label="+"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted">
                              {item.qty} × {formatIDR(item.product.price)}
                            </p>
                            <motion.p
                              key={item.qty}
                              initial={{ opacity: 0.4, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="font-display text-lg font-extrabold"
                            >
                              {formatIDR(item.product.price * item.qty)}
                            </motion.p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>

          {/* ---------- ticket summary ---------- */}
          <aside className="relative h-fit overflow-hidden rounded-card border border-line bg-surface lg:sticky lg:top-24">
            <div className="p-6">
              <h2 className="font-display text-lg font-bold">{t('cart.summary')}</h2>

              <form onSubmit={applyPromo} className={`mt-5 ${shake ? 'animate-shake' : ''}`}>
                <label className="label-mega" htmlFor="promo">
                  {t('cart.promo')}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="promo"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t('cart.promoPh')}
                    className="field !py-2.5 text-sm uppercase"
                  />
                  <motion.button whileTap={{ scale: 0.95 }} type="submit" className="btn-ghost shrink-0 !px-4 !py-2.5 text-xs">
                    {t('cart.promoApply')}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {promoMsg && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mt-2 text-xs font-semibold ${promoMsg.ok ? 'text-ok' : 'text-warn'}`}
                    >
                      {promoMsg.text}
                    </motion.p>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* perforated divider with notches */}
            <div className="relative border-t border-dashed border-line">
              <span className="absolute -left-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-bg" />
              <span className="absolute -right-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-bg" />
            </div>

            <div className="p-6">
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{t('cart.subtotalRow')}</dt>
                  <dd className="font-semibold">{formatIDR(subtotal)}</dd>
                </div>
                <AnimatePresence>
                  {discount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex justify-between overflow-hidden text-ok"
                    >
                      <dt>
                        {t('cart.discount')} ({promo.code})
                      </dt>
                      <dd className="font-semibold">−{formatIDR(discount)}</dd>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex justify-between">
                  <dt className="text-muted">{t('cart.shipping')}</dt>
                  <dd className="font-semibold">{shipping === 0 ? t('cart.free') : formatIDR(shipping)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                <span className="font-display text-sm font-bold uppercase tracking-wider">{t('cart.total')}</span>
                <motion.span key={total} initial={{ scale: 0.9, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-2xl font-extrabold">
                  {formatIDR(total)}
                </motion.span>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('cart.note')}</p>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  sfx.tap()
                  // guests must sign in first; send them back to checkout after auth
                  navigate(user ? '/checkout' : '/login?redirect=/checkout')
                }}
                className={`btn-primary mt-6 w-full ${!user ? 'border-dashed' : ''}`}
              >
                {t('cart.checkout')} →
              </motion.button>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}
