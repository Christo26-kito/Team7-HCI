import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/StoreContext'
import { formatIDR } from '../data/products'
import { sfx } from '../lib/sound'
import { GLIDE, SETTLE } from './Reveal'
import { FavButton } from './FavLikeButton'

export default function QuickView({ product, onClose }) {
  const { t, lang, addToCart } = useStore()
  const [size, setSize] = useState(null)
  const [qty, setQty] = useState(1)
  const [sizeErr, setSizeErr] = useState(false)
  const [notified, setNotified] = useState(false)
  const soon = product.status === 'soon'

  const handleAdd = () => {
    if (!size) {
      setSizeErr(true)
      sfx.error()
      setTimeout(() => setSizeErr(false), 500)
      return
    }
    addToCart(product.id, size, qty)
    sfx.click()
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${product.brand} ${product.model}`}
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="relative grid w-full max-w-3xl overflow-hidden rounded-card border border-line bg-surface shadow-pop md:grid-cols-2"
      >
        <button
          onClick={onClose}
          aria-label={t('qv.close')}
          className="absolute right-3 top-3 z-10 rounded-card border border-line bg-raised/80 p-2 text-muted backdrop-blur transition-all duration-300 ease-glide hover:rotate-90 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="img-tile aspect-square !rounded-none md:aspect-auto md:h-full">
          <motion.img
            layoutId={`shoe-img-${product.id}`}
            src={product.image}
            alt={`${product.brand} ${product.model} ${product.colorway}`}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          />
        </div>

        <div className="flex flex-col gap-4 p-6 md:p-7">
          <div>
            <p className="label-mega">{product.brand}</p>
            <h2 className="mt-1.5 font-serif text-3xl font-semibold leading-tight">{product.model}</h2>
            <p className="mt-1 text-sm text-muted">{product.colorway}</p>
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-xl font-bold">{formatIDR(product.price)}</span>
            {product.oldPrice && (
              <span className="text-sm text-muted line-through">{formatIDR(product.oldPrice)}</span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-muted">{product.desc[lang]}</p>

          {/* favourite this product straight from the quick view */}
          <FavButton productId={product.id} labeled />

          {soon ? (
            <div className="mt-auto space-y-3">
              <p className="rounded-card border border-dashed border-line bg-raised/60 px-4 py-3 text-xs leading-relaxed text-muted">
                {t('drop.sub')}
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setNotified((n) => !n)
                  sfx.tap()
                }}
                className={`btn w-full ${notified ? 'border-ok bg-ok/10 text-ok' : 'btn-primary'}`}
              >
                {notified ? t('drop.notified') : t('drop.notify')}
              </motion.button>
            </div>
          ) : (
            <>
              <div className={sizeErr ? 'animate-shake' : ''}>
                <div className="flex items-center justify-between">
                  <p className="label-mega">{t('qv.size')}</p>
                  {sizeErr && <p className="text-xs font-semibold text-warn">{t('qv.sizeErr')}</p>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-[42px] rounded-card border px-2.5 py-1.5 font-display text-xs font-semibold transition-all duration-300 ease-glide ${
                        size === s ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:border-accent hover:text-ink'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="label-mega">{t('qv.qty')}</p>
                <div className="flex items-center rounded-card border border-line">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-muted transition-colors hover:text-ink"
                    aria-label="-"
                  >
                    −
                  </button>
                  <motion.span
                    key={qty}
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                    className="w-8 text-center font-display text-sm font-bold"
                  >
                    {qty}
                  </motion.span>
                  <button
                    onClick={() => setQty((q) => Math.min(9, q + 1))}
                    className="px-3 py-1.5 text-muted transition-colors hover:text-ink"
                    aria-label="+"
                  >
                    +
                  </button>
                </div>
              </div>

              <motion.button onClick={handleAdd} whileTap={{ scale: 0.97 }} className="btn-primary mt-auto w-full">
                {t('qv.add')} — {formatIDR(product.price * qty)}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
