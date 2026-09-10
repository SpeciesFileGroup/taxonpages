import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveAssetUrl } from './url.js'

const KNOWN_ICONS = [
  { file: 'favicon.svg', rel: 'icon', type: 'image/svg+xml' },
  { file: 'favicon.ico', rel: 'icon', sizes: 'any' },
  { file: 'apple-touch-icon.png', rel: 'apple-touch-icon' }
]

export function discoverFavicons(projectRoot, baseUrl = '/') {
  return KNOWN_ICONS.flatMap(({ file, ...attrs }) =>
    existsSync(join(projectRoot, 'public', file))
      ? [{ ...attrs, href: resolveAssetUrl(`/${file}`, baseUrl) }]
      : []
  )
}
