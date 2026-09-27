import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.resetModules()
})

// request.js reads the configuration when it is first imported, so each case
// stubs it first and imports a fresh copy.
async function load(env) {
  vi.stubGlobal('__APP_ENV__', env)
  return import('@/utils/request.js')
}

describe('resolveSSRBaseURL', () => {
  it('resolves a relative API url against the server origin', async () => {
    const { makeAPIRequest, resolveSSRBaseURL } = await load({ url: '/offline/api/v1' })

    resolveSSRBaseURL('http://127.0.0.1:6173')

    expect(makeAPIRequest.defaults.baseURL).toBe('http://127.0.0.1:6173/offline/api/v1')
  })

  it('leaves an absolute API url alone', async () => {
    const { makeAPIRequest, resolveSSRBaseURL } = await load({ url: 'https://sfg.taxonworks.org/api/v1' })

    resolveSSRBaseURL('http://127.0.0.1:6173')

    expect(makeAPIRequest.defaults.baseURL).toBe('https://sfg.taxonworks.org/api/v1')
  })

  it('leaves a protocol-relative url alone', async () => {
    const { makeAPIRequest, resolveSSRBaseURL } = await load({ url: '//tw.example.org/api/v1' })

    resolveSSRBaseURL('http://127.0.0.1:6173')

    expect(makeAPIRequest.defaults.baseURL).toBe('//tw.example.org/api/v1')
  })

  it('lets an explicit ssr_url win', async () => {
    const { makeAPIRequest, resolveSSRBaseURL } = await load({
      url: '/offline/api/v1',
      ssr_url: 'http://api.internal/api/v1'
    })
    const before = makeAPIRequest.defaults.baseURL

    resolveSSRBaseURL('http://127.0.0.1:6173')

    expect(makeAPIRequest.defaults.baseURL).toBe(before)
  })
})
