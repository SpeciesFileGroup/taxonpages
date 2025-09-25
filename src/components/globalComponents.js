import { defineAsyncComponent } from 'vue'

export function registerGlobalComponents(app) {
  const files = import.meta.glob(
    ['@/components/**/*.global.vue', '~/components/**/*.global.vue'],
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
      .replace(/\.client\.global\.\w+$/, '')
      .replace(/\.global\.\w+$/, '')

    app.component(componentName, defineAsyncComponent(loader))
  })
}
