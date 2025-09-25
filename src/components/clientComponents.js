import { defineAsyncComponent } from 'vue'

export function registerOnlyClientComponents(app) {
  const files = import.meta.glob(
    ['@/components/**/*.client.vue', '~/components/**/*.client.vue'],
    {
      import: 'default'
    }
  )

  setGlobalComponents(app, files)
}

function setGlobalComponents(app, files) {
  Object.entries(files).forEach(([path, loader]) => {
    const componentName = path
      .split('/')
      .pop()
      .replace(/\.client.\w+$/, '')

    app.component(componentName, defineAsyncComponent(loader))
  })
}
