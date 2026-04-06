import { defineComponent, h } from 'vue'
import { glob } from 'glob'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..', '..', '..')

export function registerFakeClientComponents(app) {
  const projectRoot = global.__basedir || process.cwd()

  const filePaths = [
    ...glob.sync('src/**/*.client.vue', { cwd: packageRoot }),
    ...glob.sync('**/*.client.vue', { cwd: projectRoot, ignore: 'node_modules/**' })
  ]

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
