import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { formatIDR } from '../data/products'
import TrackingMap from '../components/TrackingMap'
import { GLIDE } from '../components/Reveal'
import { motion } from 'framer-motion'

export default function Track() {
  const { t, orders } = useStore()
  const { id } = useParams()
  const order = orders.find((o) => o.id === id)

  if (!order) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-28 text-center">
        <p className="font-serif text-2xl italic text-muted">{t('track.noOrder')}</p>
        <Link to="/account" className="btn-primary">{t('track.back')}</Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pt-14 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: GLIDE }} className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{t('track.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('track.sub')}</p>
        </div>
        <div className="text-right">
          <p className="label-mega">{t('track.orderLabel')}</p>
          <p className="font-display text-lg font-extrabold">{order.id}</p>
          <p className="text-xs text-muted">{order.date}</p>
        </div>
      </motion.div>

      <div className="py-8">
        <TrackingMap order={order} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-line bg-surface p-5">
          <p className="label-mega mb-2">{t('co.reviewAddr')}</p>
          <p className="font-display text-sm font-bold">{order.name}</p>
          <p className="mt-1 text-sm text-muted">{order.address}</p>
        </div>
        <div className="rounded-card border border-line bg-surface p-5">
          <p className="label-mega mb-2">{t('cart.total')}</p>
          <p className="font-display text-xl font-extrabold">{formatIDR(order.total)}</p>
          <p className="mt-1 text-xs text-muted">
            {order.items.reduce((s, i) => s + i.qty, 0)} {t('co.items')} · {t(`co.pay.${order.method}`)}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6 pb-12">
        <Link to="/account" className="btn-ghost">← {t('track.back')}</Link>
        {order.status === 'completed' && <button disabled className="btn-ghost opacity-40">{t('track.restart')}</button>}
      </div>
    </main>
  )
}
