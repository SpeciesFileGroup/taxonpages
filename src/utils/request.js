import axios from 'axios'

const {
  url,
  ssr_url,
  project_token
} = __APP_ENV__



const makeAPIRequest = axios.create({
  baseURL: (import.meta.env.SSR && ssr_url) || url,
  params: {
    project_token
  }
})

export { makeAPIRequest }
