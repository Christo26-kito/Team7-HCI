import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { StoreProvider, useStore } from './store/StoreContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import QuickView from './components/QuickView'
import Home from './pages/Home'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Success from './pages/Success'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Track from './pages/Track'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function QuickViewHost() {
  const { quick, setQuick } = useStore()
  return <AnimatePresence>{quick && <QuickView product={quick} onClose={() => setQuick(null)} />}</AnimatePresence>
}

/** Inner shell — uses store/router hooks, so it must render inside the providers. */
function Shell() {
  const { kidsMode } = useStore()
  const { pathname } = useLocation()
  const hideChrome = pathname === '/login' || pathname === '/signup'
  const kidActive = kidsMode && pathname === '/'

  /* apply the playful palette to <html> so the variables cascade to <body> */
  useEffect(() => {
    document.documentElement.classList.toggle('kids-theme', kidActive)
  }, [kidActive])

  return (
    <div className="flex min-h-screen flex-col">
      {!hideChrome && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success" element={<Success />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/account" element={<Dashboard />} />
          <Route path="/track/:id" element={<Track />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      {!hideChrome && <Footer />}
    </div>
  )
}

export default function App() {
  /* Vite base: '/' (root serve) or '/<repo>/' on GitHub Pages.
   * BrowserRouter must match so internal routes work in both dev & prod. */
  const BASE = import.meta.env.BASE_URL || '/'
  const basename = BASE === '/' ? '/' : BASE.replace(/\/+$/, '')
  return (
    <StoreProvider>
      <BrowserRouter basename={basename}>
        <ScrollToTop />
        <Shell />
        <QuickViewHost />
      </BrowserRouter>
    </StoreProvider>
  )
}
