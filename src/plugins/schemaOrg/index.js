import { loadResolver } from './loadResolver'

function transformToSchemaNode(node, { host }) {
  const nodeResolver = loadResolver(node._resolver)

  return nodeResolver(node, { host })
}

export function schemaOrgPlugin({ host }) {
  return {
    hooks: {
      'tags:resolve': async function (ctx) {
        for (const tag of ctx.tags) {
          if (tag.tag === 'script' && tag.key === 'schema-org-graph') {
            tag.innerHTML = JSON.stringify(
              {
                '@context': 'https://schema.org',
                '@graph': tag.props.nodes.map((node) => {
                  return transformToSchemaNode(node, { host })
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
