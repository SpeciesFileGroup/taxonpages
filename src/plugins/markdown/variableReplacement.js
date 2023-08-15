export function variableReplacementPlugin(md, options) {
  const regex = /{{\s*app:(.*?)\s*}}/g
  const variables = options.variables || {}

  md.core.ruler.before('normalize', 'variable_replacement', (state) => {
    state.src = state.src.replace(regex, (match, content) => {
      if (Object.hasOwn(variables, content)) {
        return variables[content]
      }

      return match
    })
  })
}
