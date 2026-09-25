/**
 * FavLikeButton.jsx — favorite (heart) + like (star) micro-interactions.
 *
 * Authenticated users persist favs/likes per account (StoreContext);
 * guests are nudged to /login (per spec: interactions require an account).
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/StoreContext'
import { sfx } from '../lib/sound'

function FavButton({ productId, className = '' }) {
  const { t, user, favs, toggleFav } = useStore()
  const navigate = useNavigate()
  const active = favs.includes(productId)

  const onClick = () => {
    if (!user) {
      sfx.tap()
      navigate('/login')
      return
    }
    toggleFav(productId)
    sfx.click()
  }

  return (
    <button
      onClick={onClick}
      aria-label={t('fav.btn')}
      title={user ? t('fav.btn') : `${t('fav.btn')} — ${t('auth.linkLogin')}`}
      className={`rounded-card border p-1.5 transition-all duration-300 ease-glide ${
        active ? 'border-warn bg-warn/10' : 'border-line text-muted hover:border-ink hover:text-ink'
      } ${className}`}
    >
      <motion.span
        key={String(active)}
        initial={{ scale: 0.5, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        className="block"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          style={{ fill: active ? 'rgb(var(--c-warn-rgb))' : 'none' }}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20s-7-4.5-9-9c-1.5-3.5 1-8 5-8 2.5 0 4 1.5 4 1.5S16.5 3 19 3c4 0 6.5 4.5 5 8-2 4.5-9 9-9 9Z" />
        </svg>
      </motion.span>
    </button>
  )
}

function LikeButton({ productId, likes, className = '' }) {
  const { t, user, liked, toggleLike } = useStore()
  const navigate = useNavigate()
  const [pop, setPop] = useState(false)
  const active = liked.includes(productId)

  const onClick = () => {
    if (!user) {
      sfx.tap()
      navigate('/login')
      return
    }
    if (!active) {
      setPop(true)
      setTimeout(() => setPop(false), 700)
    }
    toggleLike(productId)
    sfx.tap()
  }

  return (
    <button
      onClick={onClick}
      aria-label={t('like.btn')}
      className={`relative flex items-center gap-1 rounded-card px-1.5 py-0.5 text-xs transition-colors duration-300 ${
        active ? 'text-warn' : 'text-muted hover:text-ink'
      } ${className}`}
    >
      <motion.svg
        animate={pop ? { scale: [1, 1.5, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill={active ? 'rgb(var(--c-warn-rgb))' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 10v12H4V10h3Zm0 0 4-7c1.5 0 2.5 1 2.5 2.5V9h5c1.5 0 2.5 1.2 2 2.6l-2.4 7c-.4 1-1.3 1.4-2.3 1.4H7" />
      </motion.svg>
      <span className="font-display font-semibold">{(likes + (active ? 1 : 0)).toLocaleString('id-ID')}</span>
      <AnimatePresence>
        {pop && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: -12 }}
            exit={{ opacity: 0 }}
            className="absolute -top-1 right-0 text-[10px] font-bold text-warn"
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

export default function FavLikeButton({ productId, likes, compact }) {
  return (
    <>
      {!compact && <FavButton productId={productId} />}
      <LikeButton productId={productId} likes={likes} />
    </>
  )
}

export { FavButton, LikeButton }
