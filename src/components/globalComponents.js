const components = import.meta.globEager('@/components/**/*.global.vue')

const register = app => {
  Object.entries(components).forEach(([path, definition]) => {
    const componentName = path.split('/').pop().replace(/\.global.\w+$/, '')

    app.component(componentName, definition.default)
  })
}

export default {
  register
}