export function getMetaFromConfig(configObj) {
  const metaObj = Object.entries(configObj).filter(([key, value]) =>
    key.startsWith('meta_')
  )

  return metaObj.map(([key, value]) => {
    const metaKey = key.slice(5)

    return {
      name: metaKey,
      content: value
    }
  })
}
