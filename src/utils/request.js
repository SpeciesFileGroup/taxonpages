import axios from 'axios'

const {
  url,
  project_token
} = __APP_ENV__

const makeAPIRequest = axios.create({
  baseURL: url,
  params: {
    project_token
  }
})

export { makeAPIRequest }
