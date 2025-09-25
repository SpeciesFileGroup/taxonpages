export function loadUserLayouts() {
  const files = import.meta.glob('~/layouts/*.vue', {
    eager: true,
    import: 'default'
  })

  return makeLayoutObject(files)
}

function makeLayoutObject(files) {
  const components = Object.entries(files)
  const layouts = {}

  components.forEach(([path, component]) => {
    const layoutName = path.split('/').pop().replace('.vue', '')

    Object.assign(layouts, { [layoutName]: component })
  })

  return layouts
}
