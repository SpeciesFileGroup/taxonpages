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
