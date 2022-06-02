import axios from 'axios'

const {
  VITE_API_HOST,
  VITE_PROJECT_TOKEN
} = import.meta.env

const makeAPIRequest = axios.create({
  baseURL: VITE_API_HOST,
  params: {
    project_token: VITE_PROJECT_TOKEN
  }
})

export { makeAPIRequest }
