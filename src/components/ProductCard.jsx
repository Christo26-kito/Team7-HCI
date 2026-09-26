import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/StoreContext'
import { formatIDR } from '../data/products'
import { sfx } from '../lib/sound'
import { GLIDE } from './Reveal'
import { FavButton } from './FavLikeButton'

function ProductCard({ product, onQuickView }) {
  const { t, addToCart } = useStore()
  const [notified, setNotified] = useState(false)
  const soon = product.status === 'soon'
  const defaultSize = product.sizes[Math.floor(product.sizes.length / 2)]

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: GLIDE }}
      className="group flex flex-col"
    >
      <div className="relative">
        <button onClick={() => onQuickView(product)} className="block w-full text-left" aria-label={`${product.brand} ${product.model}`}>
          <div className="img-tile aspect-square shadow-none transition-shadow duration-500 ease-glide group-hover:shadow-lift">
            <div className="h-full w-full transition-transform duration-700 ease-glide group-hover:scale-[1.07]">
              <img
                src={product.image}
                alt={`${product.brand} ${product.model} ${product.colorway}`}
                loading="lazy"
              />
            </div>
            <div className="absolute left-3 top-3 z-10 flex gap-1.5">
              {soon && (
                <span className="rounded-card bg-accent px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-bg">
                  {t('drop.soon')}
                </span>
              )}
              {!soon && product.tags.includes('new') && (
                <span className="rounded-card bg-ink px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-bg">
                  {t('card.new')}
                </span>
              )}
              {product.oldPrice && (
                <span className="rounded-card bg-warn px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-bg">
                  {t('card.sale')}
                </span>
              )}
            </div>
          </div>
        </button>
        <div className="absolute right-3 top-3 z-10">
          <FavButton productId={product.id} />
        </div>
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-mega">{product.brand}</p>
          <h3 className="mt-1 truncate font-display text-base font-semibold leading-tight">{product.model}</h3>
          <p className="mt-0.5 truncate text-xs text-muted">{product.colorway}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-sm font-bold">{formatIDR(product.price)}</p>
          {product.oldPrice && <p className="text-xs text-muted line-through">{formatIDR(product.oldPrice)}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {soon ? (
          <>
            <p className="text-xs italic text-muted">{t('drop.sub')}</p>
            <button
              onClick={() => {
                setNotified((n) => !n)
                sfx.tap()
              }}
              className={`flex items-center gap-1.5 rounded-card border px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition-all duration-300 ease-glide ${
                notified ? 'border-ok bg-ok/10 text-ok' : 'border-line hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-bg'
              }`}
            >
              <motion.span key={String(notified)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
                  <path d="M10 19a2 2 0 0 0 4 0" />
                </svg>
              </motion.span>
              {notified ? t('drop.notified') : t('drop.notify')}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 text-xs text-muted">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-accent" aria-hidden>
                <path d="m12 17.3-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7L12 17.3Z" />
              </svg>
              <span className="font-semibold text-ink">{product.rating.toFixed(1)}</span>
              <span aria-hidden>·</span>
              <span>{product.likes.toLocaleString('id-ID')}</span>
            </div>
            <button
              onClick={() => {
                addToCart(product.id, defaultSize, 1)
                sfx.click()
              }}
              className="rounded-card border border-line px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition-all duration-300 ease-glide hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-bg active:translate-y-0"
            >
              {t('card.add')}
            </button>
          </>
        )}
      </div>
    </motion.article>
  )
}

export default memo(ProductCard)
