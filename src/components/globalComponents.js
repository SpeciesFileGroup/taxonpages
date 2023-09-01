export function registerGlobalComponents(app) {
  const files = import.meta.glob(
    ['@/components/**/*.global.vue', '#/components/**/*.global.vue'],
    {
      eager: true,
      import: 'default'
    }
  )

  setGlobalComponents(app, files)
}

function setGlobalComponents(app, files) {
  const components = Object.entries(files)

  components.forEach(([path, definition]) => {
    const componentName = path
      .split('/')
      .pop()
      .replace(/\.client.global.\w+$/, '')
      .replace(/\.global.\w+$/, '')

    app.component(componentName, definition)
  })
}
