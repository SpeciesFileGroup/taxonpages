import axios from 'axios'

const { url, ssr_url, project_token } = __APP_ENV__

const makeAPIRequest = axios.create({
  baseURL: (import.meta.env.SSR && ssr_url) || url,
  params: {
    project_token
  }
})

export function resolveSSRBaseURL(serverOrigin) {
  if (ssr_url || !serverOrigin || !isRelativeURL(url)) return

  makeAPIRequest.defaults.baseURL = new URL(url, serverOrigin).href
}

function isRelativeURL(value) {
  return (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
  )
}

export { makeAPIRequest }
