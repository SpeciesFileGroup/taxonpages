import axios from 'axios'
import requiredConfiguration from '@/config/api.yml'

const {
  url,
  project_token
} = requiredConfiguration

const makeAPIRequest = axios.create({
  baseURL: url,
  params: {
    project_token
  }
})

export { makeAPIRequest }
