import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/StoreContext'
import { BRANDS, CATEGORIES, COLOR_KEYS, KID_SIZES } from '../data/products'
import { GLIDE } from '../components/Reveal'
import { sfx } from '../lib/sound'

const CAT_LABEL = {
  running: { id: 'Lari', en: 'Running' },
  lifestyle: { id: 'Lifestyle', en: 'Lifestyle' },
  basketball: { id: 'Basket', en: 'Basketball' },
  trail: { id: 'Trail', en: 'Trail' },
  kids: { id: 'Anak', en: 'Kids' },
}

function Onboarding({ prefs, setPrefs, lang }) {
  const { t } = useStore()
  const toggleIn = (k, v) =>
    setPrefs((p) => ({
      ...p,
      [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v],
    }))
  const chip = (active) =>
    `rounded-card border px-2.5 py-1 font-display text-xs font-semibold transition-all duration-300 ease-glide ${
      active ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:border-accent hover:text-ink'
    }`

  return (
    <div className="mt-6 space-y-4 rounded-card border border-line bg-raised/50 p-4">
      <div>
        <p className="font-display text-sm font-semibold">{t('auth.onb.title')}</p>
        <p className="mt-0.5 text-xs text-muted">{t('auth.onb.sub')}</p>
      </div>

      <div>
        <p className="label-mega mb-2">{t('auth.onb.brand')}</p>
        <div className="flex flex-wrap gap-1.5">
          {BRANDS.map((b) => (
            <button key={b} type="button" onClick={() => toggleIn('brands', b)} className={chip(prefs.brands.includes(b))}>
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label-mega mb-2">{t('auth.onb.cat')}</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => toggleIn('categories', c)} className={chip(prefs.categories.includes(c))}>
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
              type="button"
              title={c.label[lang]}
              onClick={() => toggleIn('colors', c.key)}
              className={`h-6 w-6 rounded-full border transition-all duration-300 ease-glide hover:scale-110 ${
                prefs.colors.includes(c.key) ? 'border-ink ring-2 ring-ink ring-offset-2 ring-offset-raised' : 'border-line'
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
            <button
              key={g}
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, gender: p.gender === g ? null : g }))}
              className={chip(prefs.gender === g)}
            >
              {g === 'kids' ? CAT_LABEL.kids[lang] : t(`nav.${g}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Auth({ mode }) {
  const { t, lang, user, signup, login } = useStore()
  const navigate = useNavigate()
  const isSignup = mode === 'signup'

  const [form, setForm] = useState({ name: '', email: '', pass: '' })
  const [prefs, setPrefs] = useState({ brands: [], categories: [], colors: [], gender: null })
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState({})

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (touched[k]) setTouched((x) => ({ ...x, [k]: true }))
  }
  const blur = (k) => () => setTouched((x) => ({ ...x, [k]: true }))

  /* per-field validation (shown inline once a field is touched or after submit) */
  const fieldErr = (k) => {
    if (k === 'name' && isSignup && form.name.trim().length < 2) return 'auth.err.name'
    if (k === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'auth.err.email'
    if (k === 'pass' && form.pass.length < 6) return 'auth.err.passMin'
    return null
  }
  const showFieldErr = (k) => (touched[k] ? fieldErr(k) : null)

  const submit = async (e) => {
    e.preventDefault()
    setErr(null)
    setTouched({ name: true, email: true, pass: true })
    if (isSignup && form.name.trim().length < 2) return setErr('auth.err.name')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setErr('auth.err.email')
    if (form.pass.length < 6) return setErr('auth.err.passMin')
    setBusy(true)
    const r = isSignup
      ? await signup({ name: form.name, email: form.email, pass: form.pass, prefs })
      : await login(form.email, form.pass, prefs)
    setBusy(false)
    if (!r.ok) {
      setErr(r.err)
      sfx.error()
      return
    }
    sfx.success()
    navigate('/account')
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-16 sm:px-6">
      <div className="rounded-card border border-line bg-surface p-6 shadow-pop sm:p-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: GLIDE }}>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            {isSignup ? t('auth.signupTitle') : t('auth.title')}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{t('auth.sub')}</p>
        </motion.div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <AnimatePresence>{err && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-card border border-warn/50 bg-warn/10 px-3 py-2 text-xs font-semibold text-warn"
            >
              {t(err)}
            </motion.p>
          )}</AnimatePresence>

          {isSignup && (
            <label className="block">
              <span className="label-mega">{t('auth.name')}</span>
              <input
                className={`field mt-1.5 ${showFieldErr('name') ? '!border-warn/70' : ''}`}
                value={form.name}
                onChange={set('name')}
                onBlur={blur('name')}
                placeholder="Gabriel"
                autoComplete="name"
                aria-invalid={!!showFieldErr('name')}
              />
              {showFieldErr('name') && <p className="mt-1 text-xs font-semibold text-warn">{t(showFieldErr('name'))}</p>}
            </label>
          )}
          <label className="block">
            <span className="label-mega">{t('auth.email')}</span>
            <input
              type="email"
              required
              className={`field mt-1.5 ${showFieldErr('email') ? '!border-warn/70' : ''}`}
              value={form.email}
              onChange={set('email')}
              onBlur={blur('email')}
              placeholder="kamu@email.com"
              autoComplete="email"
              aria-invalid={!!showFieldErr('email')}
            />
            {showFieldErr('email') && <p className="mt-1 text-xs font-semibold text-warn">{t(showFieldErr('email'))}</p>}
          </label>
          <label className="block">
            <span className="label-mega">{t('auth.pass')}</span>
            <input
              type="password"
              required
              className={`field mt-1.5 ${showFieldErr('pass') ? '!border-warn/70' : ''}`}
              value={form.pass}
              onChange={set('pass')}
              onBlur={blur('pass')}
              placeholder="••••••"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              aria-invalid={!!showFieldErr('pass')}
            />
            {showFieldErr('pass') && <p className="mt-1 text-xs font-semibold text-warn">{t(showFieldErr('pass'))}</p>}
          </label>

          {isSignup && <Onboarding prefs={prefs} setPrefs={setPrefs} lang={lang} />}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={busy}
            className="btn-primary w-full disabled:opacity-60"
            type="submit"
          >
            {busy ? '…' : isSignup ? t('auth.signup') : t('auth.login')}
          </motion.button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {isSignup ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
          <Link to={isSignup ? '/login' : '/signup'} className="font-display font-semibold text-accent hover:underline">
            {isSignup ? t('auth.linkLogin') : t('auth.linkSignup')}
          </Link>
        </p>
        <p className="mt-3 text-center text-[11px] italic text-muted/70">{t('auth.demoNote')}</p>
      </div>
    </main>
  )
}
