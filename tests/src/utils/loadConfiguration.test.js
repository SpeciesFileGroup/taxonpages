import { describe, it, expect, vi } from 'vitest'
import { loadConfiguration } from '@/utils/loadConfiguration.js'
import { loadYaml } from '@/utils/loadYaml.js'
import defaultConfig from '@/constants/defaultConfig.js'
import { createProject } from '../../helpers/project.js'

describe('loadYaml', () => {
  it('returns the fallback for empty or comment-only content', () => {
    expect(loadYaml('')).toEqual({})
    expect(loadYaml('  \n# only a comment\n', null)).toBe(null)
  })

  it('parses documents and still throws on real syntax errors', () => {
    expect(loadYaml('a: 1')).toEqual({ a: 1 })
    expect(() => loadYaml('a: [1, 2')).toThrow()
  })
})

describe('loadConfiguration', () => {
  it('merges every config/*.yml over the defaults', () => {
    const root = createProject({
      'config/api.yml': 'url: https://tw.org/api/v1\nproject_token: abc',
      'config/empty.yml': '# nothing here yet'
    })

    const config = loadConfiguration(root)

    expect(config).toMatchObject({ ...defaultConfig, url: 'https://tw.org/api/v1', project_token: 'abc' })
  })

  it('applies *.development.yml overrides outside production only', () => {
    const root = createProject({
      'config/api.yml': 'url: https://prod.org',
      'config/api.development.yml': 'url: http://localhost:3000'
    })

    vi.stubEnv('NODE_ENV', 'development')
    expect(loadConfiguration(root).url).toBe('http://localhost:3000')

    vi.stubEnv('NODE_ENV', 'production')
    expect(loadConfiguration(root).url).toBe('https://prod.org')
  })

  it('merges top-level keys shallowly', () => {
    const root = createProject({ 'config/i18n.yml': 'i18n:\n  locales: [en, es]' })

    expect(loadConfiguration(root).i18n).toEqual({ locales: ['en', 'es'] })
  })

  it('returns the defaults for a project without config/', () => {
    expect(loadConfiguration(createProject())).toEqual(defaultConfig)
  })
})
