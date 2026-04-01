// @ts-check
import { resolve, basename } from 'node:path'
import { readdirSync, existsSync } from 'node:fs'
import { Router } from 'express'
import { loadEnvFile } from './loadEnvFile.js'

const ROUTE_EXTENSIONS = ['.js', '.mjs']

/**
 * Create a sandboxed context object passed to each route factory.
 *
 * @param {string} projectRoot
 * @returns {{ env: Record<string, string|undefined>, router: () => import('express').Router, projectRoot: string }}
 */
function createRouteContext(projectRoot) {
  loadEnvFile(projectRoot)

  const safeEnv = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith('TAXONPAGES_'))
  )

  return {
    env: safeEnv,
    router: () => Router(),
    projectRoot
  }
}

/**
 * Discover route files from ~/server/routes/*.js and return
 * an array of { name, handler } ready to mount on Express.
 *
 * Each file must export a default function that receives a RouteContext
 * and returns an Express Router:
 *
 *   export default function ({ env, router }) {
 *     const r = router()
 *     r.get('/search', async (req, res) => { ... })
 *     return r
 *   }
 *
 * The file name determines the route prefix:
 *   ~/server/routes/taxonworks.js  →  /api/taxonworks/*
 *
 * @param {string} projectRoot - Absolute path to the user's project
 * @returns {Promise<Array<{ name: string, handler: Router }>>}
 */
export async function loadApiRoutes(projectRoot) {
  const routesDir = resolve(projectRoot, 'server', 'routes')

  if (!existsSync(routesDir)) return []

  const files = readdirSync(routesDir).filter((f) =>
    ROUTE_EXTENSIONS.some((ext) => f.endsWith(ext))
  )

  const routes = []

  for (const file of files) {
    const ext = ROUTE_EXTENSIONS.find((e) => file.endsWith(e))
    const name = basename(file, ext)
    const filePath = resolve(routesDir, file)

    try {
      // Append a version query param to bust the ESM module cache on reload
      const fileUrl = String(new URL(`file://${filePath}`))
      const version = globalThis.__apiRouteVersions?.[fileUrl] || 0
      const importPath = version > 0 ? `${fileUrl}?v=${version}` : fileUrl

      const mod = await import(importPath)
      const factory = mod.default

      if (typeof factory !== 'function') {
        console.warn(
          `[taxonpages] Route file "${file}" does not export a default function. Skipping.`
        )
        continue
      }

      const ctx = createRouteContext(projectRoot)
      const handler = factory(ctx)

      routes.push({ name, handler })
    } catch (err) {
      console.error(`[taxonpages] Failed to load route "${file}":`, err.message)
    }
  }

  if (routes.length > 0) {
    console.log(
      `[taxonpages] Loaded ${routes.length} API route(s): ${routes.map((r) => `/api/${r.name}`).join(', ')}`
    )
  }

  return routes
}
