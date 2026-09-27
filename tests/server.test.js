import { describe, it, expect } from 'vitest'
import { socketOrigin } from '../server.js'

const request = (localAddress, localPort) => ({ socket: { localAddress, localPort } })

describe('socketOrigin', () => {
  it('builds an origin from the socket the request arrived on', () => {
    expect(socketOrigin(request('127.0.0.1', 6173))).toBe('http://127.0.0.1:6173')
  })

  it('unwraps IPv4-mapped IPv6 addresses', () => {
    expect(socketOrigin(request('::ffff:192.168.1.5', 80))).toBe('http://192.168.1.5:80')
  })

  it('brackets IPv6 addresses', () => {
    expect(socketOrigin(request('::1', 6173))).toBe('http://[::1]:6173')
  })
})

describe('describeUnhandledRejection', () => {
  it('reduces an axios error to its message and URL', async () => {
    const { describeUnhandledRejection } = await import('../server.js')
    const error = Object.assign(new Error('Request failed with status code 404'), {
      isAxiosError: true,
      config: { method: 'get', baseURL: 'http://127.0.0.1:6173/offline/api/v1', url: '/taxon_names.json' }
    })

    expect(describeUnhandledRejection(error)).toBe(
      '[taxonpages] Unhandled promise rejection, the server keeps running: ' +
        'Request failed with status code 404 (GET http://127.0.0.1:6173/offline/api/v1/taxon_names.json)'
    )
  })

  it('logs the stack of any other error', async () => {
    const { describeUnhandledRejection } = await import('../server.js')
    expect(describeUnhandledRejection(new Error('boom'))).toMatch(/keeps running: Error: boom\n\s+at /)
  })
})
