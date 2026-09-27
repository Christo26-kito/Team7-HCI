/* Post-build: create a SPA 404 fallback for GitHub Pages.
 * GitHub Pages serves 404.html (from the deployed dir) for any unknown URL,
 * so refreshing on a client-side route (e.g. /Team7-HCI/checkout) boots the
 * app instead of showing a 404. Assets keep the correct base (/Team7-HCI/).
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = process.cwd() + '/dist'
const from = join(dist, 'index.html')
const to = join(dist, '404.html')

if (!existsSync(from)) {
  console.error('[404] dist/index.html not found — run "vite build" first.')
  process.exit(1)
}

copyFileSync(from, to)
writeFileSync(join(dist, '.nojekyll'), '')
console.log('[404] SPA fallback ready: dist/404.html (+ .nojekyll)')
