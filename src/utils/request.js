import axios from 'axios'

const {
  url,
  project_token,
  project_scope_tag_id
} = __APP_ENV__

const makeAPIRequest = axios.create({
  baseURL: url,
  params: {
    project_token,
    project_scope_tag_id
  }
})

export { makeAPIRequest }
