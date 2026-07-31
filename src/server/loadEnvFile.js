import { loadEnv } from 'vite'

/**
 * Load TAXONPAGES_* variables from .env files into process.env.
 * Uses Vite's loadEnv which supports .env, .env.local,
 * .env.[mode], and .env.[mode].local files.
 *
 * Existing env vars are not overwritten.
 *
 * @param {string} projectRoot
 */
export function loadEnvFile(projectRoot) {
  const mode = process.env.NODE_ENV || 'development'
  const env = loadEnv(mode, projectRoot, 'TAXONPAGES_')

  for (const [key, value] of Object.entries(env)) {
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}
