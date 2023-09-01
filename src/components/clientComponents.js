export function registerOnlyClientComponents(app) {
  const files = import.meta.glob(
    ['@/components/**/*.client.vue', '#/components/**/*.client.vue'],
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
      .replace(/\.client.\w+$/, '')

    app.component(componentName, definition)
  })
}
