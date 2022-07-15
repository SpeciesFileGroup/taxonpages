export default (data) => ({
  name: 'html-transform',
  transformIndexHtml: {
    enforce: 'pre',
    transform: (html) => {
      return html.replace(/<%-(.*?)%>/g, (_, p1) =>
        data[p1.trim()] || ''
      )
    }
  }
})
