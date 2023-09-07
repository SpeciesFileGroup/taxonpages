import { defineComponent, h } from 'vue'
import glob from 'glob'

export function registerFakeClientComponents(app) {
  const filePaths = glob.sync('src/components/**/*.client.vue')
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
