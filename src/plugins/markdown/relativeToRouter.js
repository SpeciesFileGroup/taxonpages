export function relativeToRouterPlugin(md, configuration) {
  const isStaticAsset = (url) => {
    const regex = /\.\w+$/

    return regex.test(url)
  }

  const makeUrlToStaticAsset = (url) => {
    const baseUrl = configuration.base_url || ''

    return (baseUrl + url).replaceAll('//', '/')
  }

  const scan = (state) => {
    state.tokens.forEach((tokens) => {
      if (tokens.type !== 'inline') {
        return
      }
      const inlineTokens = tokens.children
      let isRT = false
      for (let i = 0; i < inlineTokens.length; i++) {
        if (isRT && inlineTokens[i].type === 'link_close') {
          inlineTokens[i].tag = 'router-link'
          isRT = false
        } else if (inlineTokens[i].type === 'link_open') {
          const attrs = inlineTokens[i].attrs
          const href = attrs?.find((v) => v[0] === 'href')

          if (
            href &&
            !href[1].startsWith('http') &&
            !href[1].startsWith('mailto')
          ) {
            if (isStaticAsset(href[1])) {
              href[1] = makeUrlToStaticAsset(href[1])
              inlineTokens[i].attrs.push(['target', '_blank'])
            } else {
              inlineTokens[i].tag = 'router-link'
              inlineTokens[i].attrs = [['to', href[1]]]
              isRT = true
            }
          } else {
            inlineTokens[i].attrs.push(['rel', 'noopener noreferrer'])
            inlineTokens[i].attrs.push(['target', '_blank'])
          }
        }
      }
    })
  }
  md.core.ruler.push('router-link', scan)
}
