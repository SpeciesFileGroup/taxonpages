const components = import.meta.globEager('@/components/**/*.vue')

const register = app => {
  Object.entries(components).forEach(([path, definition]) => {
    const componentName = path.split('/').pop().replace(/\.\w+$/, '')

    app.component(componentName, definition.default)
  })
}

export default {
  register
}