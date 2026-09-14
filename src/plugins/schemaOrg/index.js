import { loadResolver } from './loadResolver'

function transformToSchemaNode(node, context) {
  const nodeResolver = loadResolver(node._resolver)

  return nodeResolver(node, context)
}

/**
 * @param {object} context
 * @param {string} context.host
 * @param {() => string} context.getLocale - Read when the graph is built, not
 *   captured when the plugin is created. Under hash_mode the locale changes
 *   through in-app navigation, so a value taken at boot goes stale and every
 *   `@id` keeps naming the language the reader started in.
 */
export function schemaOrgPlugin({ host, getLocale }) {
  return {
    hooks: {
      'tags:resolve': async function (ctx) {
        for (const tag of ctx.tags) {
          if (tag.tag === 'script' && tag.key === 'schema-org-graph') {
            tag.innerHTML = JSON.stringify(
              {
                '@context': 'https://schema.org',
                '@graph': tag.props.nodes.map((node) => {
                  return transformToSchemaNode(node, { host, locale: getLocale?.() })
                })
              },
              null,
              2
            )
            delete tag.props.nodes
          }
        }
      }
    }
  }
}
