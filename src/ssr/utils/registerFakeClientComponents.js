import { defineComponent, h } from 'vue'
import { glob } from 'glob'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverNpmPackages } from '../../plugins/vite/discoverPackages.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..', '..', '..')

export function registerFakeClientComponents(app) {
  const projectRoot = global.__basedir || process.cwd()

  const filePaths = [
    ...glob.sync('src/**/*.client.vue', { cwd: packageRoot }),
    ...glob.sync('**/*.client.vue', { cwd: projectRoot, ignore: 'node_modules/**' })
  ]

  const npmPackages = discoverNpmPackages(projectRoot)
  for (const pkg of npmPackages) {
    const matches = glob.sync('**/*.client.vue', { cwd: pkg.path })
    filePaths.push(...matches.map((f) => resolve(pkg.path, f)))
  }

  const vueComponent = defineComponent({
    setup() {
      return () => h('div')
    }
  })

  filePaths.forEach((path) => {
    const componentName = path
      .split('/')
      .pop()
      .replace(/\.client.\w+$/, '')

    app.component(componentName, vueComponent)
  })
}
