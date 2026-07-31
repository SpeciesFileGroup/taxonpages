export function registerGlobalComponents(app) {
  const files = import.meta.glob(
    [
      '@/components/**/*.global.vue',
      '~/components/**/*.global.vue',
      '~/modules/**/components/**/*.global.vue',
      '@/modules/**/components/**/*.global.vue'
    ],
    {
      eager: true,
      import: 'default'
    }
  )

  setGlobalComponents(app, files)
}

function setGlobalComponents(app, files) {
  Object.entries(files).forEach(([path, component]) => {
    const componentName = path
      .split('/')
      .pop()
      .replace(/\.client\.global\.\w+$/, '')
      .replace(/\.global\.\w+$/, '')

    app.component(componentName, component)
  })
}
