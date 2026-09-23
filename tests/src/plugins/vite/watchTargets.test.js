import { describe, it, expect } from 'vitest'
import { getWatchTarget, watchTargetsFor } from '@/plugins/vite/watchTargets.js'

describe('getWatchTarget', () => {
  it.each([
    ['/site/config/**/*.yml', '/site/config'],
    ['/site/panels/*/main.js', '/site/panels'],
    ['/site/public/favicon.*', '/site/public'],
    ['C:\\site\\layouts\\*.vue', 'C:/site/layouts'],
    ['**/*.js', '.'],
    ['/site/config/{a,b}.yml', '/site/config']
  ])('%s → %s', (pattern, expected) => {
    expect(getWatchTarget(pattern)).toBe(expected)
  })

  it('deduplicates targets', () => {
    expect(watchTargetsFor(['/a/*.yml', '/a/**/*.css', '/b/*'])).toEqual(['/a', '/b'])
  })
})
