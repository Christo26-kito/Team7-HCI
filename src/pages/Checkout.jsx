import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/StoreContext'
import { formatIDR } from '../data/products'
import { sfx } from '../lib/sound'
import { GLIDE } from '../components/Reveal'

const STEPS = ['co.step1', 'co.step2', 'co.step3']

const PAY_METHODS = [
  { key: 'card', icon: '💳' },
  { key: 'ewallet', icon: '📱' },
  { key: 'cod', icon: '💵' },
]

function Check() {
  return (
    <motion.span
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ok"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4 4 10-10" />
      </svg>
    </motion.span>
  )
}

function Field({ label, error, valid, shake, className = '', ...inputProps }) {
  return (
    <label className={`block ${className} ${shake && error ? 'animate-shake' : ''}`}>
      <span className="label-mega">{label}</span>
      <span className="relative mt-1.5 block">
        <input
          {...inputProps}
          className={`field pr-9 ${error ? '!border-warn' : valid ? '!border-ok' : ''}`}
        />
        <AnimatePresence>{valid && !error && <Check />}</AnimatePresence>
      </span>
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1 block text-xs font-semibold text-warn"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  )
}

const validators = {
  name: (v) => (v.trim().length >= 3 ? null : 'err.required'),
  email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'err.email'),
  phone: (v) => (/^\d{9,15}$/.test(v.replace(/[\s-]/g, '')) ? null : 'err.phone'),
  address: (v) => (v.trim().length >= 8 ? null : 'err.required'),
  city: (v) => (v.trim() ? null : 'err.required'),
  zip: (v) => (/^\d{5}$/.test(v) ? null : 'err.zip'),
  cardNo: (v) => (/^\d{16}$/.test(v.replace(/\s/g, '')) ? null : 'err.card'),
  cardExp: (v) => (/^(0[1-9]|1[0-2])\/\d{2}$/.test(v) ? null : 'err.exp'),
  cardCvv: (v) => (/^\d{3}$/.test(v) ? null : 'err.cvv'),
}

export default function Checkout() {
  const { t, cartDetailed, subtotal, discount, shipping, total, placeOrder, clearCart } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [shake, setShake] = useState(false)
  const [payLater, setPayLater] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    method: 'card',
    cardNo: '',
    cardExp: '',
    cardCvv: '',
  })
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => {
    const v = e.target.value
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: validators[k] ? validators[k](v) : null }))
  }

  const stepFields = [
    ['name', 'email', 'phone', 'address', 'city', 'zip'],
    form.method === 'card' ? ['cardNo', 'cardExp', 'cardCvv'] : [],
    [],
  ]

  const validateStep = (s) => {
    const next = {}
    stepFields[s].forEach((k) => {
      const err = validators[k](form[k])
      if (err) next[k] = err
    })
    setErrors(next)
    if (Object.keys(next).length) {
      setShake(true)
      sfx.error()
      setTimeout(() => setShake(false), 500)
      return false
    }
    sfx.tap()
    return true
  }

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(2, s + 1))
  }

  const confirmOrder = () => {
    const order = {
      id: 'SA-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
      items: cartDetailed.map((i) => ({ pid: i.id, model: i.product.model, brand: i.product.brand, size: i.size, qty: i.qty, price: i.product.price, image: i.product.image })),
      subtotal,
      discount,
      shipping,
      total,
      name: form.name,
      address: `${form.address}, ${form.city} ${form.zip}`,
      city: form.city,
      zip: form.zip,
      method: form.method,
    }
    if (payLater) {
      // Save as a PENDING order so it shows up in Order History → Pending Payment.
      placeOrder({ ...order, status: 'pending' })
      clearCart()
      sfx.tap()
      navigate('/account')
    } else {
      // Immediate payment → courier already on the way.
      placeOrder({ ...order, status: 'inprogress' })
      clearCart()
      sfx.success()
      navigate('/success')
    }
  }

  const err = (k) => (errors[k] ? t(errors[k]) : null)
  const ok = (k) => form[k] && !validators[k](form[k])

  return (
    <main className="mx-auto max-w-4xl px-4 pt-14 sm:px-6">
      <div className="border-b border-line pb-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{t('co.title')}</h1>
        <p className="mt-2 text-sm text-muted">{t('co.sub')}</p>
      </div>

      {/* Step indicator */}
      <div className="pt-10">
        <div className="relative flex justify-between">
          <div className="absolute left-0 right-0 top-[13px] h-px bg-line" />
          <motion.div
            className="absolute left-0 top-[13px] h-px bg-ink"
            initial={false}
            animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.6, ease: GLIDE }}
          />
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => i < step && setStep(i)}
              className="relative flex flex-col items-center gap-2 bg-bg px-2"
              disabled={i > step}
            >
              <motion.span
                animate={{ scale: i === step ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className={`flex h-7 w-7 items-center justify-center rounded-full border font-display text-xs font-bold transition-colors duration-500 ease-glide ${
                  i <= step ? 'border-ink bg-ink text-bg' : 'border-line bg-bg text-muted'
                }`}
              >
                {i < step ? (
                  <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 13 4 4 10-10" />
                  </motion.svg>
                ) : (
                  i + 1
                )}
              </motion.span>
              <span className={`font-display text-[11px] font-semibold uppercase tracking-wider ${i === step ? 'text-ink' : 'text-muted'}`}>
                {t(s)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="py-10">
        <>
          {/* ---------- STEP 1: ADDRESS ---------- */}
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ x: 32 }}
              animate={{ x: 0 }}
              exit={{ x: -32 }}
              transition={{ duration: 0.45, ease: GLIDE }}
              className="grid gap-5 sm:grid-cols-2"
            >
              <Field label={t('co.name')} value={form.name} onChange={set('name')} error={err('name')} valid={ok('name')} shake={shake} placeholder="Andi Wijaya" className="sm:col-span-2" />
              <Field label={t('co.email')} type="email" value={form.email} onChange={set('email')} error={err('email')} valid={ok('email')} shake={shake} placeholder="andi@email.com" />
              <Field label={t('co.phone')} inputMode="numeric" value={form.phone} onChange={set('phone')} error={err('phone')} valid={ok('phone')} shake={shake} placeholder="08123456789" />
              <Field label={t('co.address')} value={form.address} onChange={set('address')} error={err('address')} valid={ok('address')} shake={shake} placeholder="Jl. Merdeka No. 45, RT 02/RW 03" className="sm:col-span-2" />
              <Field label={t('co.city')} value={form.city} onChange={set('city')} error={err('city')} valid={ok('city')} shake={shake} placeholder="Tangerang" />
              <Field label={t('co.zip')} inputMode="numeric" maxLength={5} value={form.zip} onChange={set('zip')} error={err('zip')} valid={ok('zip')} shake={shake} placeholder="15810" />
            </motion.div>
          )}

          {/* ---------- STEP 2: PAYMENT ---------- */}
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ x: 32 }}
              animate={{ x: 0 }}
              exit={{ x: -32 }}
              transition={{ duration: 0.45, ease: GLIDE }}
            >
              <p className="label-mega mb-3">{t('co.payTitle')}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {PAY_METHODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => {
                      setForm((f) => ({ ...f, method: m.key }))
                      sfx.tap()
                    }}
                    className={`relative rounded-card border p-4 text-left transition-all duration-300 ease-glide ${
                      form.method === m.key ? 'border-ink shadow-lift' : 'border-line hover:border-accent'
                    }`}
                  >
                    {form.method === m.key && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="pointer-events-none absolute inset-0 rounded-card border-2 border-ink"
                      />
                    )}
                    <span className="text-xl">{m.icon}</span>
                    <p className="mt-2 font-display text-sm font-semibold">{t(`co.pay.${m.key}`)}</p>
                    <p className="mt-0.5 text-xs text-muted">{t(`co.pay.${m.key}Sub`)}</p>
                  </button>
                ))}
              </div>

              {form.method === 'card' && (
                <div className="grid gap-5 pt-6 sm:grid-cols-[2fr_1fr_1fr]">
                  <Field label={t('co.cardNo')} inputMode="numeric" value={form.cardNo} onChange={set('cardNo')} error={err('cardNo')} valid={ok('cardNo')} shake={shake} placeholder="4242 4242 4242 4242" />
                  <Field label={t('co.cardExp')} value={form.cardExp} onChange={set('cardExp')} error={err('cardExp')} valid={ok('cardExp')} shake={shake} placeholder="12/28" />
                  <Field label={t('co.cardCvv')} inputMode="numeric" maxLength={3} value={form.cardCvv} onChange={set('cardCvv')} error={err('cardCvv')} valid={ok('cardCvv')} shake={shake} placeholder="123" />
                </div>
              )}
            </motion.div>
          )}

          {/* ---------- STEP 3: REVIEW ---------- */}
          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ x: 32 }}
              animate={{ x: 0 }}
              exit={{ x: -32 }}
              transition={{ duration: 0.45, ease: GLIDE }}
              className="space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-card border border-line bg-surface p-5">
                  <p className="label-mega mb-2">{t('co.payNow')} / {t('co.payLater')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPayLater(false)}
                      className={`rounded-card border px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 ease-glide ${
                        !payLater ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:border-accent'
                      }`}
                    >
                      {t('co.payNow')}
                    </button>
                    <button
                      onClick={() => setPayLater(true)}
                      className={`rounded-card border px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 ease-glide ${
                        payLater ? 'border-warn bg-warn text-bg' : 'border-line text-muted hover:border-accent'
                      }`}
                    >
                      {t('co.payLater')}
                    </button>
                  </div>
                  {payLater && <p className="mt-2 text-[11px] text-muted">{t('co.payLaterSub')}</p>}
                </div>
                <div className="rounded-card border border-line bg-surface p-5">
                  <p className="label-mega mb-2">{t('co.reviewAddr')}</p>
                  <p className="font-display text-sm font-bold">{form.name}</p>
                  <p className="mt-1 text-sm text-muted">{form.address}</p>
                  <p className="text-sm text-muted">
                    {form.city} {form.zip}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {form.email} · {form.phone}
                  </p>
                </div>
                <div className="rounded-card border border-line bg-surface p-5">
                  <p className="label-mega mb-2">{t('co.reviewPay')}</p>
                  <p className="font-display text-sm font-bold">{t(`co.pay.${form.method}`)}</p>
                  <p className="mt-1 text-xs text-muted">{t(`co.pay.${form.method}Sub`)}</p>
                </div>
              </div>

              <div className="rounded-card border border-line bg-surface p-5">
                <p className="label-mega mb-3">
                  {cartDetailed.length} {t('co.items')}
                </p>
                <ul className="divide-y divide-line-soft">
                  {cartDetailed.map((i) => (
                    <li key={`${i.id}-${i.size}`} className="flex items-center gap-4 py-3">
                      <span className="img-tile h-12 w-12 shrink-0">
                        <img src={i.product.image} alt={i.product.model} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-sm font-semibold">{i.product.model}</span>
                        <span className="block text-xs text-muted">
                          {t('cart.size')} {i.size} · ×{i.qty}
                        </span>
                      </span>
                      <span className="font-display text-sm font-bold">{formatIDR(i.product.price * i.qty)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">{t('cart.subtotalRow')}</dt>
                    <dd>{formatIDR(subtotal)}</dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-ok">
                      <dt>{t('cart.discount')}</dt>
                      <dd>−{formatIDR(discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted">{t('cart.shipping')}</dt>
                    <dd>{shipping === 0 ? t('cart.free') : formatIDR(shipping)}</dd>
                  </div>
                  <div className="flex justify-between pt-1 font-display text-base font-extrabold">
                    <dt>{t('cart.total')}</dt>
                    <dd>{formatIDR(total)}</dd>
                  </div>
                </dl>
              </div>
            </motion.div>
          )}
        </>

        {/* Nav buttons */}
        <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
          {step > 0 ? (
            <button onClick={() => setStep((s) => s - 1)} className="btn-ghost">
              ← {t('co.back')}
            </button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <motion.button whileTap={{ scale: 0.97 }} onClick={next} className="btn-primary">
              {t('co.next')} →
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.97 }} onClick={confirmOrder} className="btn-primary">
              {t('co.place')} — {formatIDR(total)}
            </motion.button>
          )}
        </div>
      </div>
    </main>
  )
}
